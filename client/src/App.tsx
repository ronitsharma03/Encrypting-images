import { useState } from 'react'
import './App.css'
import FileUpload from './components/FileUpload'
import FileList from './components/FileList'
import Login from './components/Login'
import Register from './components/Register'
import { useAuth } from './contexts/AuthContext'

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const { user, loading, logout } = useAuth();

  // Handle successful login
  const handleLoginSuccess = () => {
    // No need to do anything - the auth context will update automatically
    console.log("Login successful");
  };

  // Handle successful registration
  const handleRegisterSuccess = () => {
    // After successful registration, show the login form
    setShowRegister(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Secure Cloud Storage</h1>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <button 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                onClick={logout}
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              onClick={() => setShowRegister(false)}
            >
              Login
            </button>
          )}
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
        {user ? (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Your Secure Files</h2>
            
            {/* Display file list */}
            <FileList />
            
            {/* Divider */}
            <div className="my-6 border-t border-gray-200"></div>
            
            {/* Upload form */}
            <h3 className="text-md font-medium mb-4">Upload New File</h3>
            <FileUpload />
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 max-w-md mx-auto">
            {showRegister ? (
              <Register 
                onSuccess={handleRegisterSuccess} 
                onLoginClick={() => setShowRegister(false)} 
              />
            ) : (
              <Login 
                onSuccess={handleLoginSuccess} 
                onRegisterClick={() => setShowRegister(true)} 
              />
            )}
          </div>
        )}
      </main>
      
      <footer className="bg-white py-4 border-t fixed bottom-0 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-sm text-gray-500 text-center">
            Zero-Knowledge Encrypted Storage | All data encrypted in your browser before upload
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
