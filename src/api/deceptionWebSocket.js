import api from './api';

/**
 * Start a deception game.
 *
 * @param {string} roomCode
 * @param {string[]} selectedRoles
 * @returns {Promise<Object>}
 */
export async function startGame(roomCode, selectedRoles = []) {
  const response = await api.post(
    `/deception/rooms/${roomCode}/start`,
    {
      selectedRoles,
    }
  );

  return response.data.data;
}

/**
 * Get the current game state.
 *
 * @param {string} sessionId
 * @returns {Promise<Object>}
 */
export async function getGameState(sessionId) {
  const response = await api.get(
    `/deception/rooms/${sessionId}/state`
  );

  return response.data.data;
}