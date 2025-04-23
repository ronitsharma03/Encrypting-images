import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_KEY || ''
  }
});

const bucketName = process.env.AWS_BUCKET_NAME || 'secure-cloud-storage';

/**
 * Upload an encrypted file to S3
 * @param fileId Unique identifier for the file
 * @param encryptedData Base64 encoded encrypted file data
 * @returns S3 key of the uploaded file
 */
export const uploadToS3 = async (fileId: string, encryptedData: string): Promise<string> => {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Create S3 key - should be unique
    const s3Key = `encrypted-files/${fileId}`;
    
    // Upload to S3
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: 'application/octet-stream' // Generic binary data
    }));
    
    return s3Key;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to storage');
  }
};

/**
 * Get an encrypted file from S3
 * @param s3Key S3 key of the file to retrieve
 * @returns Base64 encoded encrypted file data
 */
export const getFromS3 = async (s3Key: string): Promise<string> => {
  try {
    // Get from S3
    const response = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    }));
    
    // Convert stream to buffer
    if (!response.Body) {
      throw new Error('Empty response from S3');
    }
    
    // @ts-ignore - transformToByteArray() is available on response.Body
    const arrayBuffer = await response.Body.transformToByteArray();
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert buffer to base64
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error getting file from S3:', error);
    throw new Error('Failed to retrieve file from storage');
  }
};

/**
 * Delete a file from S3
 * @param s3Key S3 key of the file to delete
 */
export const deleteFromS3 = async (s3Key: string): Promise<void> => {
  try {
    await s3Client.send(new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key
    }));
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from storage');
  }
}; 