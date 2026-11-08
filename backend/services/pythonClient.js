import axios from 'axios';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000/api';

export const pythonClient = axios.create({
  baseURL: PYTHON_SERVICE_URL,
  timeout: 45000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const checkPythonServiceHealth = async () => {
  try {
    const res = await pythonClient.get('/health');
    return { online: true, data: res.data };
  } catch (err) {
    return { online: false, error: err.message };
  }
};
