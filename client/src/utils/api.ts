import axios from 'axios';

// Create axios instance with base URL and default headers
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to include auth token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Types for API responses
export interface User {
  id: string;
  email: string;
  publicKey: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  createdAt: string;
}

export interface EncryptedFileData {
  id: string;
  fileName: string;
  fileType: string;
  encryptedData: string;
  iv: string;
  encryptedKey: string;
  hash: string;
  createdAt: string;
}

// Auth API calls
export const authAPI = {
  register: async (email: string, password: string, publicKey: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', {
      email,
      password,
      publicKey
    });
    return response.data;
  },
  
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', {
      email,
      password
    });
    return response.data;
  },
  
  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get<{ user: User }>('/auth/me');
    return response.data;
  }
};

// Files API calls
export const filesAPI = {
  uploadFile: async (fileData: {
    encryptedData: string;
    iv: string;
    fileName: string;
    fileType: string;
    hash: string;
    encryptedKey: string;
  }): Promise<UploadedFile> => {
    const response = await api.post<UploadedFile>('/files/upload', fileData);
    return response.data;
  },
  
  getFiles: async (): Promise<{ files: UploadedFile[] }> => {
    const response = await api.get<{ files: UploadedFile[] }>('/files');
    return response.data;
  },
  
  getFileById: async (id: string): Promise<EncryptedFileData> => {
    const response = await api.get<EncryptedFileData>(`/files/${id}`);
    return response.data;
  },
  
  deleteFile: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/files/${id}`);
    return response.data;
  }
};

export default api; 