import { useState, useEffect } from 'react';
import { UploadedFile, filesAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { decryptAESKey, decryptImage, importPrivateKey, base64ToArrayBuffer } from '../utils/encryption';

const FileList = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const { privateKey } = useAuth();
  
  useEffect(() => {
    loadFiles();
  }, []);
  
  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { files } = await filesAPI.getFiles();
      setFiles(files);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError('Failed to load your files. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDownload = async (fileId: string) => {
    if (!privateKey) {
      setError('Private key not found. Unable to decrypt files.');
      return;
    }
    
    try {
      setDownloadingFileId(fileId);
      
      // Get the encrypted file data from the server
      const fileData = await filesAPI.getFileById(fileId);
      
      // Import the private key
      const privateKeyObj = await importPrivateKey(privateKey);
      
      // Decrypt the AES key with the private key
      const aesKey = await decryptAESKey(fileData.encryptedKey, privateKeyObj);
      
      // Decrypt the file with the AES key
      const decryptedFile = await decryptImage(
        fileData.encryptedData,
        fileData.iv,
        aesKey,
        fileData.fileName,
        fileData.fileType,
        fileData.hash
      );
      
      if (!decryptedFile) {
        throw new Error('Failed to decrypt file. The file may be corrupted.');
      }
      
      // Create a download URL and trigger download
      const url = URL.createObjectURL(decryptedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = decryptedFile.name;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (err) {
      console.error('Failed to download file:', err);
      setError('Failed to decrypt and download file.');
    } finally {
      setDownloadingFileId(null);
    }
  };
  
  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }
    
    try {
      await filesAPI.deleteFile(fileId);
      setFiles(files.filter(file => file.id !== fileId));
    } catch (err) {
      console.error('Failed to delete file:', err);
      setError('Failed to delete file.');
    }
  };
  
  if (loading && files.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading your encrypted files...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        <p>{error}</p>
        <button 
          onClick={loadFiles}
          className="mt-2 text-sm text-blue-600 hover:text-blue-800"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  if (files.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">You haven't uploaded any files yet.</p>
      </div>
    );
  }
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Your Encrypted Files ({files.length})</h3>
      <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
        {files.map((file) => (
          <li key={file.id} className="px-4 py-3 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-2 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-md">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload(file.id)}
                  disabled={downloadingFileId === file.id}
                  className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-1"
                  title="Decrypt and download this file"
                >
                  {downloadingFileId === file.id ? (
                    <>
                      <div className="animate-spin h-3 w-3 border-b-2 border-blue-600 rounded-full"></div>
                      <span>Decrypting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Download</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 flex items-center gap-1"
                  title="Delete this file"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileList; 