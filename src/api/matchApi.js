import api from './api';

export async function getRecentMatches() {
  const response = await api.get('/matches/recent');
  return response.data;
}

export async function getMatchHistory(matchId) {
  const response = await api.get(`/matches/${matchId}`);
  return response.data;
}

export async function saveOfflineMatch(match) {
  const response = await api.post('/matches/offline', match);
  return response.data.data;
}
