import { useState, useRef, FormEvent } from 'react';
import { 
  generateAESKey, 
  encryptImage, 
  encryptAESKey,
  importPublicKey
} from '../utils/encryption';
import { useAuth } from '../contexts/AuthContext';
import { filesAPI } from '../utils/api';

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { publicKey, user } = useAuth();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    
    if (selectedFile) {
      // Basic validation
      if (!selectedFile.type.startsWith('image/')) {
        setError('Please select an image file');
        setFile(null);
        return;
      }
      
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size exceeds 10MB limit');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setSuccess(false);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file first');
      return;
    }
    
    if (!publicKey || !user) {
      setError('You must be logged in with a valid encryption key');
      return;
    }
    
    try {
      setIsEncrypting(true);
      setProgress(10);
      setError(null);
      setSuccess(false);
      
      // Step 1: Generate a random AES key for this specific image
      const aesKey = await generateAESKey();
      setProgress(20);
      
      // Step 2: Encrypt the image with the AES key
      const encryptedImageData = await encryptImage(file, aesKey);
      setProgress(40);
      
      // Step 3: Import the public key
      const publicKeyObj = await importPublicKey(publicKey);
      setProgress(50);
      
      // Step 4: Encrypt the AES key with the user's RSA public key
      const encryptedKey = await encryptAESKey(aesKey, publicKeyObj);
      setProgress(60);
      
      setIsEncrypting(false);
      setIsUploading(true);
      
      // Step 5: Send the encrypted data to the server
      await filesAPI.uploadFile({
        encryptedData: encryptedImageData.encryptedData,
        iv: encryptedImageData.iv,
        fileName: encryptedImageData.fileName,
        fileType: encryptedImageData.fileType,
        hash: encryptedImageData.hash,
        encryptedKey
      });
      
      setProgress(100);
      setSuccess(true);
      
      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      
      // Trigger refresh of file list (this would ideally use a context or state management system)
      window.dispatchEvent(new CustomEvent('fileUploaded'));
      
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsEncrypting(false);
      setIsUploading(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };
  
  const handleReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    setError(null);
    setProgress(0);
    setSuccess(false);
  };
  
  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 p-6">
        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">
            File uploaded and encrypted successfully! Only you can decrypt and view this file.
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-sm font-medium">
            Select Image
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={isEncrypting || isUploading}
          />
          {file && (
            <p className="mt-2 text-sm text-gray-500">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-500 text-sm rounded">
            {error}
          </div>
        )}
        
        {(isEncrypting || isUploading || progress > 0) && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {isEncrypting 
                ? 'Encrypting your image...' 
                : isUploading 
                  ? 'Uploading securely...' 
                  : progress === 100 
                    ? 'Upload complete!' 
                    : ''}
            </p>
          </div>
        )}
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={isEncrypting || isUploading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            disabled={!file || isEncrypting || isUploading || !publicKey}
          >
            {isEncrypting 
              ? 'Encrypting...' 
              : isUploading 
                ? 'Uploading...' 
                : 'Upload & Encrypt'}
          </button>
        </div>
      </form>
      
      <div className="mt-4 p-4 bg-gray-50 rounded text-xs text-gray-500 border border-gray-200">
        <p className="mb-1"><strong>Security Note:</strong></p>
        <p>Your image is first encrypted with AES-256 on your device. Then, the encryption key is secured with your personal RSA-2048 public key. This means only you, with your private key, can decrypt and view the image.</p>
      </div>
    </div>
  );
};

export default FileUpload; 