import api from './api';

export const generateInviteToken = async (eventId) => {
  const response = await api.post(`/events/${eventId}/judge-invite`);
  return response.data.data;
};

export const getInviteToken = async (eventId) => {
  const response = await api.get(`/events/${eventId}/judge-invite`);
  return response.data.data;
};

export const validateInviteToken = async (token) => {
  const response = await api.get(`/judge-invite/${token}`);
  return response.data.data;
};

export const joinAsJudge = async (token, payload) => {
  const response = await api.post(`/judge-invite/${token}/join`, payload);
  return response.data.data;
};
