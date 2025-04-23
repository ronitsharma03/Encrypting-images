import { Router } from 'express';
import { uploadFile, getFiles, getFileById, deleteFile } from '../controllers/fileController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateJwt);

// Upload a new encrypted file
router.post('/upload', uploadFile);

// Get all user's encrypted files
router.get('/', getFiles);

// Get a specific file by ID
router.get('/:id', getFileById);

// Delete a file
router.delete('/:id', deleteFile);

export default router; 