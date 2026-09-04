import api from './api';

/*
 * Get games available in GameHub.
 */
export async function getGames() {

  const response = await api.get('/games');

  return response.data;
}

/*
 * Get a specific game by slug.
 */
export async function getGameBySlug(slug) {

  const response = await api.get(
    `/games/${slug}`
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
    '/games/create',
    data
  );

  return response.data;
}