import { Request, Response, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

// Register a new user
export const register: RequestHandler = async (req, res) => {
  try {
    const { email, password, publicKey } = req.body;
    
    if (!email || !password || !publicKey) {
      res.status(400).json({ error: 'Email, password, and publicKey are required' });
      return;
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with public key
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        publicKey
      }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    // Return user data (excluding password) and token
    res.status(201).json({
      user: {
        id: newUser.id,
        email: newUser.email,
        publicKey: newUser.publicKey
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// Login existing user
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );
    
    // Return user data (excluding password) and token
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        publicKey: user.publicKey
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Get current user information
export const getCurrentUser: RequestHandler = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Return user data (excluding password)
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        publicKey: user.publicKey
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error fetching user data' });
  }
}; 