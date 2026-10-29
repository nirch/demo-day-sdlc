import api from './api';

export const getCriteria = async (eventId) => {
  const response = await api.get(`/events/${eventId}/criteria`);
  return response.data.data;
};

export const createCriterion = async (eventId, payload) => {
  const response = await api.post(`/events/${eventId}/criteria`, payload);
  return response.data.data;
};

export const updateCriterion = async (eventId, criterionId, payload) => {
  const response = await api.put(`/events/${eventId}/criteria/${criterionId}`, payload);
  return response.data.data;
};

export const deleteCriterion = async (eventId, criterionId) => {
  await api.delete(`/events/${eventId}/criteria/${criterionId}`);
};

export const reorderCriteria = async (eventId, orderedIds) => {
  const response = await api.put(`/events/${eventId}/criteria/reorder`, { orderedIds });
  return response.data.data;
};
