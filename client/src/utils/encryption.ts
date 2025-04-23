/**
 * Secure Cloud Storage Encryption Utilities
 * 
 * This module handles client-side encryption/decryption using Web Crypto API
 * with a Zero-Knowledge approach, where even the server cannot access the content.
 */

/**
 * Generates a new RSA key pair for the user
 * @returns Promise with the generated keypair
 */
export const generateRSAKeyPair = async (): Promise<CryptoKeyPair> => {
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
        hash: { name: "SHA-256" },
      },
      true, // extractable
      ["encrypt", "decrypt"] // key usage
    );
  } catch (error) {
    console.error("Error generating RSA key pair:", error);
    throw new Error("Failed to generate encryption keys");
  }
};

/**
 * Exports the public key as base64 string (to be sent to server)
 */
export const exportPublicKey = async (publicKey: CryptoKey): Promise<string> => {
  try {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    return arrayBufferToBase64(exported);
  } catch (error) {
    console.error("Error exporting public key:", error);
    throw new Error("Failed to export public key");
  }
};

/**
 * Exports the private key as base64 string (to be stored securely)
 */
export const exportPrivateKey = async (privateKey: CryptoKey): Promise<string> => {
  try {
    const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    return arrayBufferToBase64(exported);
  } catch (error) {
    console.error("Error exporting private key:", error);
    throw new Error("Failed to export private key");
  }
};

/**
 * Imports a public key from base64 string
 */
export const importPublicKey = async (publicKeyBase64: string): Promise<CryptoKey> => {
  try {
    const keyData = base64ToArrayBuffer(publicKeyBase64);
    return await window.crypto.subtle.importKey(
      "spki",
      keyData,
      {
        name: "RSA-OAEP",
        hash: { name: "SHA-256" },
      },
      true,
      ["encrypt"]
    );
  } catch (error) {
    console.error("Error importing public key:", error);
    throw new Error("Failed to import public key");
  }
};

/**
 * Imports a private key from base64 string
 */
export const importPrivateKey = async (privateKeyBase64: string): Promise<CryptoKey> => {
  try {
    const keyData = base64ToArrayBuffer(privateKeyBase64);
    return await window.crypto.subtle.importKey(
      "pkcs8",
      keyData,
      {
        name: "RSA-OAEP",
        hash: { name: "SHA-256" },
      },
      true,
      ["decrypt"]
    );
  } catch (error) {
    console.error("Error importing private key:", error);
    throw new Error("Failed to import private key");
  }
};

/**
 * Generates a new AES key for image encryption
 */
export const generateAESKey = async (): Promise<CryptoKey> => {
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true, // extractable
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Error generating AES key:", error);
    throw new Error("Failed to generate image encryption key");
  }
};

/**
 * Encrypts an AES key with RSA public key
 */
export const encryptAESKey = async (aesKey: CryptoKey, publicKey: CryptoKey): Promise<string> => {
  try {
    // Export the AES key to raw format
    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);
    
    // Encrypt the AES key with the RSA public key
    const encryptedKey = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      publicKey,
      exportedAesKey
    );
    
    return arrayBufferToBase64(encryptedKey);
  } catch (error) {
    console.error("Error encrypting AES key:", error);
    throw new Error("Failed to encrypt image key");
  }
};

/**
 * Decrypts an AES key with RSA private key
 */
export const decryptAESKey = async (encryptedKeyBase64: string, privateKey: CryptoKey): Promise<CryptoKey> => {
  try {
    // Convert base64 to ArrayBuffer
    const encryptedKey = base64ToArrayBuffer(encryptedKeyBase64);
    
    // Decrypt the AES key
    const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      privateKey,
      encryptedKey
    );
    
    // Import the decrypted AES key
    return await window.crypto.subtle.importKey(
      "raw",
      decryptedKeyBuffer,
      {
        name: "AES-GCM",
        length: 256
      },
      true,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error("Error decrypting AES key:", error);
    throw new Error("Failed to decrypt image key. You may not have permission to view this image.");
  }
};

/**
 * Encrypts an image file using AES-GCM
 * @returns Object containing the encrypted data, IV, and original file information
 */
export const encryptImage = async (file: File, aesKey: CryptoKey): Promise<{
  encryptedData: string;
  iv: string;
  fileName: string;
  fileType: string;
  hash: string;
}> => {
  try {
    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Get file data as ArrayBuffer
    const fileBuffer = await file.arrayBuffer();
    
    // Calculate SHA-256 hash of original file for integrity verification
    const fileHash = await calculateSHA256(fileBuffer);
    
    // Encrypt the file data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv
      },
      aesKey,
      fileBuffer
    );
    
    return {
      encryptedData: arrayBufferToBase64(encryptedData),
      iv: arrayBufferToBase64(iv),
      fileName: file.name,
      fileType: file.type,
      hash: fileHash
    };
  } catch (error) {
    console.error("Error encrypting image:", error);
    throw new Error("Failed to encrypt image");
  }
};

/**
 * Decrypts an encrypted image using AES-GCM
 */
export const decryptImage = async (
  encryptedDataBase64: string,
  ivBase64: string,
  aesKey: CryptoKey,
  fileName: string,
  fileType: string,
  originalHash: string
): Promise<File | null> => {
  try {
    // Convert base64 to ArrayBuffer
    const encryptedData = base64ToArrayBuffer(encryptedDataBase64);
    const iv = base64ToArrayBuffer(ivBase64);
    
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      aesKey,
      encryptedData
    );
    
    // Verify the hash to ensure integrity
    const decryptedHash = await calculateSHA256(decryptedBuffer);
    if (decryptedHash !== originalHash) {
      console.error("Hash mismatch! The file may be corrupted or tampered with.");
      return null;
    }
    
    // Create a File object from the decrypted data
    return new File([decryptedBuffer], fileName, { type: fileType });
  } catch (error) {
    console.error("Error decrypting image:", error);
    throw new Error("Failed to decrypt image");
  }
};

/**
 * Calculates SHA-256 hash of data
 */
export const calculateSHA256 = async (data: ArrayBuffer): Promise<string> => {
  try {
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    return arrayBufferToBase64(hashBuffer);
  } catch (error) {
    console.error("Error calculating hash:", error);
    throw new Error("Failed to calculate file hash");
  }
};

/**
 * Helper to convert ArrayBuffer to Base64 string
 */
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Helper to convert Base64 string to ArrayBuffer
 */
export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}; 