
import api from './api';

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

  return response.data.data;
}

export async function getActiveSession(roomCode) {
  const response = await api.get(
    `/deception/rooms/${roomCode}/active-session`
  );

  return response.data.data;
}

export async function startFishpond(roomCode) {
  const response = await api.post(
    `/fishpond/rooms/${roomCode}/start`
  );

  return response.data.data;
}

export async function getFishpondState(roomCode) {
  const response = await api.get(
    `/fishpond/rooms/${roomCode}/state`
  );

  return response.data.data;
}

export async function getGameState(
  sessionId
) {
  try {
    const response = await api.get(
      `/deception/rooms/${sessionId}/state`
    );

    return response.data.data;

  } catch (error) {

    console.log(
      'GAME STATE ERROR STATUS:',
      error.response?.status
    );

    console.log(
      'GAME STATE ERROR DATA:',
      error.response?.data
    );

    console.log(
      'GAME STATE ERROR MESSAGE:',
      error.response?.data?.message
    );

    throw error;
  }
}

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

  return response.data.data;
}

export async function startVoting(
  sessionId
) {
  const response = await api.post(
    `/deception/rooms/${sessionId}/start-voting`
  );

  return response.data.data;
}

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

  return response.data.data;
}

export async function getDayState(
  sessionId
) {
  const response = await api.get(
    `/deception/rooms/${sessionId}/day`
  );

  return response.data.data;
}

export async function getGameResult(
  sessionId
) {
  const response = await api.get(
    `/deception/rooms/${sessionId}/result`
  );

  return response.data.data;
}

export async function getInvestigationResult(
  sessionId
) {
  const response = await api.get(
    `/deception/rooms/${sessionId}/investigation`
  );

  return response.data.data;
}

export async function sendGameChatMessage(sessionId, message) {
  const response = await api.post(
    `/deception/rooms/${sessionId}/chat`,
    { message }
  );

  return response.data;
}
