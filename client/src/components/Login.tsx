import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginProps {
  onSuccess?: () => void;
  onRegisterClick: () => void;
}

const Login = ({ onSuccess, onRegisterClick }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await login(email, password);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login failed:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full">
      <h2 className="text-xl font-medium mb-6 text-center">Login to Your Account</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded border border-red-200">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2 text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            placeholder="your@email.com"
            autoComplete="email"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="block text-gray-700 mb-2 text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>
        
        <div className="flex flex-col gap-4">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
          
          <div className="text-center">
            <span className="text-sm text-gray-600">Don't have an account? </span>
            <button
              type="button"
              onClick={onRegisterClick}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={isLoading}
            >
              Register here
            </button>
          </div>
        </div>
      </form>
      
      <div className="mt-6 p-4 bg-gray-50 rounded text-xs text-gray-500 border border-gray-200">
        <p className="mb-1"><strong>Security Note:</strong></p>
        <p>Your files are encrypted with your personal encryption keys. Even we cannot access your original images.</p>
      </div>
    </div>
  );
};

export default Login; 