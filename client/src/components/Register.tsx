import { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterProps {
  onSuccess?: () => void;
  onLoginClick: () => void;
}

const Register = ({ onSuccess, onLoginClick }: RegisterProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  
  const { register } = useAuth();
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Please fill all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setIsGeneratingKeys(true);
      
      // Register will generate keys and create account
      await register(email, password);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Registration failed. Email may already be in use.');
      console.error('Registration failed:', err);
    } finally {
      setIsLoading(false);
      setIsGeneratingKeys(false);
    }
  };
  
  return (
    <div className="w-full">
      <h2 className="text-xl font-medium mb-6 text-center">Create Your Secure Account</h2>
      
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
        
        <div className="mb-4">
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
            autoComplete="new-password"
          />
          <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters</p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="confirmPassword" className="block text-gray-700 mb-2 text-sm font-medium">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            placeholder="••••••••"
            autoComplete="new-password"
          />
        </div>
        
        <div className="flex flex-col gap-4">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            disabled={isLoading}
          >
            {isLoading 
              ? isGeneratingKeys 
                ? 'Generating encryption keys...' 
                : 'Creating account...' 
              : 'Create Account'}
          </button>
          
          <div className="text-center">
            <span className="text-sm text-gray-600">Already have an account? </span>
            <button
              type="button"
              onClick={onLoginClick}
              className="text-sm text-blue-600 hover:text-blue-800"
              disabled={isLoading}
            >
              Login here
            </button>
          </div>
        </div>
      </form>
      
      <div className="mt-6 p-4 bg-gray-50 rounded text-xs text-gray-500 border border-gray-200">
        <p className="mb-1"><strong>Security Note:</strong></p>
        <p>When you register, we'll generate a unique encryption key pair for your account. This enables end-to-end encryption where only you can decrypt your files.</p>
      </div>
    </div>
  );
};

export default Register; 