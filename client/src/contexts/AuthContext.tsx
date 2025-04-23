import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { authAPI, User } from '../utils/api';
import { generateRSAKeyPair, exportPublicKey, exportPrivateKey } from '../utils/encryption';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  publicKey: string | null;
  privateKey: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);

  // Load user and keys from localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const privateKeyStored = localStorage.getItem('privateKey');
        const publicKeyStored = localStorage.getItem('publicKey');
        
        if (privateKeyStored) setPrivateKey(privateKeyStored);
        if (publicKeyStored) setPublicKey(publicKeyStored);
        
        if (token) {
          // If we have a token, try to get the current user
          const { user } = await authAPI.getCurrentUser();
          setUser(user);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear potentially invalid token
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { user, token } = await authAPI.login(email, password);
      
      // Store token and user data
      localStorage.setItem('token', token);
      setUser(user);
      
      // In a real app, we would get the user's public key from the response
      // and retrieve their private key from secure storage or prompt them to provide it
      if (user.publicKey) {
        setPublicKey(user.publicKey);
        localStorage.setItem('publicKey', user.publicKey);
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate RSA key pair for the user
      const keyPair = await generateRSAKeyPair();
      const publicKeyString = await exportPublicKey(keyPair.publicKey);
      const privateKeyString = await exportPrivateKey(keyPair.privateKey);
      
      // Register with public key
      const { user, token } = await authAPI.register(email, password, publicKeyString);
      
      // Store everything
      localStorage.setItem('token', token);
      localStorage.setItem('publicKey', publicKeyString);
      localStorage.setItem('privateKey', privateKeyString);
      
      setUser(user);
      setPublicKey(publicKeyString);
      setPrivateKey(privateKeyString);
    } catch (error) {
      console.error('Registration error:', error);
      setError('Failed to register account. Email may already be in use.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    // Note: In a real app, you might not want to clear the private key on logout
    // as it's a sensitive piece of information that should be securely stored
    setUser(null);
    setLoading(false);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        publicKey,
        privateKey,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 