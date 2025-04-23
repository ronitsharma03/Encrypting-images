import { Request, Response, RequestHandler } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../index';
import { uploadToS3, getFromS3, deleteFromS3 } from '../utils/s3';

// Upload a new encrypted file
export const uploadFile: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { encryptedData, iv, fileName, fileType, hash, encryptedKey } = req.body;
    
    if (!encryptedData || !iv || !fileName || !fileType || !hash || !encryptedKey) {
      res.status(400).json({ error: 'Missing required file data' });
      return;
    }
    
    // Generate a unique ID for the file
    const fileId = uuidv4();
    
    // Upload encrypted data to S3
    const s3Key = await uploadToS3(fileId, encryptedData);
    
    // Store file metadata in database (not the file content)
    const encryptedFile = await prisma.encryptedFile.create({
      data: {
        id: fileId,
        fileName,
        fileType,
        s3Key,
        encryptedKey,
        iv,
        hash,
        userId: req.user.id
      }
    });
    
    res.status(201).json({
      id: encryptedFile.id,
      fileName: encryptedFile.fileName,
      fileType: encryptedFile.fileType,
      createdAt: encryptedFile.createdAt
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Server error during file upload' });
  }
};

// Get all encrypted files for a user
export const getFiles: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    // Get all files for the user (metadata only, not content)
    const files = await prisma.encryptedFile.findMany({
      where: {
        userId: req.user.id
      },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.status(200).json({ files });
  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({ error: 'Server error fetching files' });
  }
};

// Get a specific encrypted file by ID
export const getFileById: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { id } = req.params;
    
    // Get file metadata from database
    const file = await prisma.encryptedFile.findUnique({
      where: {
        id
      }
    });
    
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    
    // Security check - ensure the file belongs to the user
    if (file.userId !== req.user.id) {
      res.status(403).json({ error: 'Access denied to this file' });
      return;
    }
    
    // Get encrypted data from S3
    const encryptedData = await getFromS3(file.s3Key);
    
    // Return both the file metadata and encrypted content
    res.status(200).json({
      id: file.id,
      fileName: file.fileName,
      fileType: file.fileType,
      encryptedData,
      iv: file.iv,
      encryptedKey: file.encryptedKey,
      hash: file.hash,
      createdAt: file.createdAt
    });
  } catch (error) {
    console.error('Get file by ID error:', error);
    res.status(500).json({ error: 'Server error fetching file' });
  }
};

// Delete a file
export const deleteFile: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const { id } = req.params;
    
    // Get file to verify ownership and get S3 key
    const file = await prisma.encryptedFile.findUnique({
      where: {
        id
      }
    });
    
    if (!file) {
      res.status(404).json({ error: 'File not found' });
      return;
    }
    
    // Security check - ensure the file belongs to the user
    if (file.userId !== req.user.id) {
      res.status(403).json({ error: 'Access denied to this file' });
      return;
    }
    
    // Delete from S3
    await deleteFromS3(file.s3Key);
    
    // Delete from database
    await prisma.encryptedFile.delete({
      where: {
        id
      }
    });
    
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Server error deleting file' });
  }
}; 