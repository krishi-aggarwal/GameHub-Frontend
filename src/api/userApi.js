import api from './api';

export async function getCurrentUserProfile() {
  const response = await api.get('/users/profile');
  return response.data;
}
