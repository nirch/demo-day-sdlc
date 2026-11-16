import api from './api';

export const getEvents = async () => {
  const response = await api.get('/events');
  return response.data.data;
};

export const createEvent = async (payload) => {
  const response = await api.post('/events', payload);
  return response.data.data;
};

export const getEvent = async (id) => {
  const response = await api.get(`/events/${id}`);
  return response.data.data;
};

export const deleteEvent = async (id) => {
  const response = await api.delete(`/events/${id}`);
  return response.data.data;
};

export const selectWinner = async (eventId, teamId) => {
  const response = await api.put(`/events/${eventId}/winner`, { teamId });
  return response.data.data;
};
