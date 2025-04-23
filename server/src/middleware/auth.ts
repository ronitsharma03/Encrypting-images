import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

// Extend the Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

export const authenticateJwt: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'Unauthorized - Invalid token format' });
      return;
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as { id: string; email: string };
    
    // Check if user exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });
    
    if (!user) {
      res.status(401).json({ error: 'Unauthorized - User not found' });
      return;
    }
    
    // Attach user to request object
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
}; 