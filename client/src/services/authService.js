import API from './api';

export const registerUser = async (userData) => {
  const response = await API.post('/auth/register', userData);
  return response.data;
};

export const loginUser = async (credentials) => {
  const response = await API.post('/auth/login', credentials);
  return response.data;
};

export const loginStaff = async (credentials) => {
  const response = await API.post('/staff/login', credentials);
  return response.data;
};

export const registerStaff = async (staffData) => {
  const response = await API.post('/staff/register', staffData);
  return response.data;
};

export const getMe = async () => {
  const response = await API.get('/auth/me');
  return response.data;
};
