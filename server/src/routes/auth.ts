import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController';
import { authenticateJwt } from '../middleware/auth';

const router = Router();

// Register a new user with secure keypair
router.post('/register', register);

// Login with email and password
router.post('/login', login);

// Get the current authenticated user
router.get('/me', authenticateJwt, getCurrentUser);

export default router; 