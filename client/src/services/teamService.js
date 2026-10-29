import api from './api';

export const getTeams = async (eventId) => {
  const response = await api.get(`/events/${eventId}/teams`);
  return response.data.data;
};

export const createTeam = async (eventId, payload) => {
  const response = await api.post(`/events/${eventId}/teams`, payload);
  return response.data.data;
};

export const updateTeam = async (eventId, teamId, payload) => {
  const response = await api.put(`/events/${eventId}/teams/${teamId}`, payload);
  return response.data.data;
};

export const deleteTeam = async (eventId, teamId) => {
  await api.delete(`/events/${eventId}/teams/${teamId}`);
};

export const reorderTeams = async (eventId, orderedIds) => {
  const response = await api.put(`/events/${eventId}/teams/reorder`, { orderedIds });
  return response.data.data;
};
