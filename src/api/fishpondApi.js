import api from './api';

export async function getFishpondState(roomCode) {
  const response = await api.get(
    `/fishpond/rooms/${roomCode}/state`
  );

  return response.data.data;
}

export async function submitFishpondMessage(roomCode, message) {
  const response = await api.post(
    `/fishpond/rooms/${roomCode}/submit`,
    { message }
  );

  return response.data.data;
}

export async function navigateFishpondMessage(roomCode, action) {
  const response = await api.post(
    `/fishpond/rooms/${roomCode}/navigate`,
    { action }
  );

  return response.data.data;
}

export async function revealFishpondAuthors(roomCode) {
  const response = await api.post(
    `/fishpond/rooms/${roomCode}/reveal-authors`
  );

  return response.data.data;
}

export async function sendFishpondChat(roomCode, message) {
  const response = await api.post(
    `/fishpond/rooms/${roomCode}/chat`,
    { message }
  );

  return response.data.data;
}