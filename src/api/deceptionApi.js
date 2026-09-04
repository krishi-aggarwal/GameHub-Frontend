import api from './api';

/*
 * Start Deception Around Us.
 */
export async function startGame(
  roomCode,
  selectedRoles = []
) {

  const response = await api.post(
    `/deception/rooms/${roomCode}/start`,
    {
      selectedRoles,
    }
  );

  return response.data;
}

/*
 * Get the player's current game state.
 */
export async function getGameState(
  sessionId
) {

  const response = await api.get(
    `/deception/rooms/${sessionId}/state`
  );

  return response.data;
}

/*
 * Submit a night action.
 *
 * action:
 * ELIMINATE
 * PROTECT
 * INVESTIGATE
 */
export async function submitNightAction(
  sessionId,
  action,
  targetUserId
) {

  const response = await api.post(
    `/deception/rooms/${sessionId}/night/${action}`,
    {
      targetUserId,
    }
  );

  return response.data;
}

/*
 * Host starts voting.
 */
export async function startVoting(
  sessionId
) {

  const response = await api.post(
    `/deception/rooms/${sessionId}/start-voting`
  );

  return response.data;
}

/*
 * Submit a vote.
 */
export async function submitVote(
  sessionId,
  targetUserId
) {

  const response = await api.post(
    `/deception/rooms/${sessionId}/vote`,
    {
      targetUserId,
    }
  );

  return response.data;
}

/*
 * Get current day information.
 */
export async function getDayState(
  sessionId
) {

  const response = await api.get(
    `/deception/rooms/${sessionId}/day`
  );

  return response.data;
}

/*
 * Get final result.
 */
export async function getGameResult(
  sessionId
) {

  const response = await api.get(
    `/deception/rooms/${sessionId}/result`
  );

  return response.data;
}

/*
 * Get private detective investigation result.
 */
export async function getInvestigationResult(
  sessionId
) {

  const response = await api.get(
    `/deception/rooms/${sessionId}/investigation`
  );

  return response.data;
}