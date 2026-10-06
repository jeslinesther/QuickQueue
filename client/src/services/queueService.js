import API from './api';

export const getLiveQueue = async () => {
  const response = await API.get('/queue');
  return response.data;
};

export const callNextToken = async () => {
  const response = await API.post('/staff/call-next');
  return response.data;
};

export const markCustomerArrived = async (tokenId) => {
  const response = await API.post('/staff/customer-arrived', { tokenId });
  return response.data;
};

export const startService = async (tokenId) => {
  const response = await API.post('/staff/start-service', { tokenId });
  return response.data;
};

export const completeService = async (tokenId) => {
  const response = await API.post('/staff/complete', { tokenId });
  return response.data;
};

export const markMissed = async (tokenId) => {
  const response = await API.post('/staff/missed', { tokenId });
  return response.data;
};
