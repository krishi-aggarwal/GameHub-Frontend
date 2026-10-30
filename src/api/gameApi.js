import api from './api';

/*
 * Get all games available in GameHub.
 */
export async function getGames() {
  const response = await api.get('/games');

  return response.data;
}

/*
 * Get a specific game by ID.
 */
export async function getGameById(gameId) {
  const response = await api.get(
    `/games/${gameId}`
  );

  return response.data;
}

/*
 * Get a specific game by slug.
 */
export async function getGameBySlug(slug) {
  const response = await api.get(
    `/games/slug/${slug}`
  );

  return response.data;
}

/*
 * Admin only.
 *
 * Create a new game.
 */
export async function createGame(data) {
  const response = await api.post(
    '/games',
    data
  );

  return response.data;
}

export async function updateGame(gameId, data) {
  const response = await api.put(`/games/${gameId}`, data);
  return response.data.data;
}

export async function deleteGame(gameId) {
  const response = await api.delete(`/games/${gameId}`);
  return response.data;
}