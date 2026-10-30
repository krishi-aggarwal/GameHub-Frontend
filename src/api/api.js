import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const defaultBackendUrl = Platform.OS === 'android'
  ? 'http://10.0.2.2:8080'
  : 'http://localhost:8080';

export const BACKEND_URL = (
  process.env.EXPO_PUBLIC_API_URL || defaultBackendUrl
).replace(/\/+$/, '');

function isPublicAuthRequest(url = '') {
  return /\/auth\/(login|register)(?:[?#]|$)/.test(url);
}

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================================
// REQUEST INTERCEPTOR
// ================================
api.interceptors.request.use(
  async (config) => {
    console.log('📡 API REQUEST:', {
      method: config.method,
      url: `${config.baseURL}${config.url}`,
    });

    if (isPublicAuthRequest(config.url)) {
      return config;
    }

    const token = await AsyncStorage.getItem('gamehub_token');

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('❌ REQUEST SETUP ERROR:', error);
    return Promise.reject(error);
  }
);

// ================================
// RESPONSE INTERCEPTOR
// ================================
api.interceptors.response.use(
  (response) => {
    console.log('✅ API RESPONSE:', {
      status: response.status,
      url: `${response.config.baseURL}${response.config.url}`,
    });

    return response;
  },
  (error) => {
    console.error('❌ API ERROR:', {
      message: error.message,
      code: error.code,
      url: error.config
        ? `${error.config.baseURL}${error.config.url}`
        : undefined,
      status: error.response?.status,
    });

    return Promise.reject(error);
  }
);

export default api;