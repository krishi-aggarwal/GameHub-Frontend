import api from './api';

export async function login(username, password) {
  const response = await api.post('/auth/login', {
    username,
    password,
  });

  return response.data;
}

export async function register(data) {
  const response = await api.post('/auth/register', data);

  return response.data;
}