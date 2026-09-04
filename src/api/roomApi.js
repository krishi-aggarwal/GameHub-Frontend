import api from './api';

export async function createRoom(data) {
  const response = await api.post('/rooms', data);

  // ApiResponse -> actual room data
  return response.data.data;
}

export async function joinRoom(roomCode) {
  const response = await api.post(
    `/rooms/${roomCode}/join`
  );

  // ApiResponse -> actual room data
  return response.data.data;
}

export async function getRoom(roomCode) {
  const response = await api.get(
    `/rooms/${roomCode}`
  );

  return response.data;
}

export async function leaveRoom(roomCode) {
  const response = await api.delete(
    `/rooms/${roomCode}/leave`
  );

  return response.data;
}

export async function getAllRooms() {
  const response = await api.get('/rooms');

  return response.data;
}