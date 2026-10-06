import API from './api';

export const generateToken = async (serviceType) => {
  const response = await API.post('/tokens', { serviceType });
  return response.data;
};

export const getCurrentToken = async () => {
  const response = await API.get('/tokens/current');
  return response.data;
};

export const getTokenHistory = async () => {
  const response = await API.get('/tokens/history');
  return response.data;
};
