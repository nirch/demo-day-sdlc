import api from './api';

export const getScores = async (eventId, teamId) => {
  const response = await api.get(`/events/${eventId}/teams/${teamId}/scores`);
  return response.data.data;
};

export const putScores = async (eventId, teamId, payload) => {
  const response = await api.put(`/events/${eventId}/teams/${teamId}/scores`, payload);
  return response.data.data;
};

export const getScoresSummary = async (eventId) => {
  const response = await api.get(`/events/${eventId}/teams/scores-summary`);
  return response.data.data;
};

export const getScoringsSummary = async (eventId) => {
  const response = await api.get(`/events/${eventId}/scoring-summary`);
  return response.data.data;
};
