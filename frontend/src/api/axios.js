import axios from 'axios';

let baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  if (import.meta.env.DEV) {
    baseURL = 'http://localhost:5000';
  } else {
    throw new Error('VITE_API_BASE_URL environment variable is required in production builds');
  }
}

const api = axios.create({ baseURL });

export default api;
