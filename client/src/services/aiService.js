import API from './api';

export const predictWaitTime = async (queueParams) => {
  const response = await API.post('/ai/predict-wait-time', queueParams);
  return response.data;
};
