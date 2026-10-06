import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nexusgear_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 && localStorage.getItem('nexusgear_token')) {
      localStorage.removeItem('nexusgear_token');
      localStorage.removeItem('nexusgear_user');
      window.dispatchEvent(new Event('nexusgear:unauthorized'));
    }
    let message = error.response?.data?.error?.message;
    if (!message) {
      message = error.response
        ? error.message || 'Ocurrió un error inesperado'
        : 'No se pudo conectar con el servidor. Verifica tu conexión.';
    }
    return Promise.reject(Object.assign(error, { uiMessage: message }));
  }
);

export default api;
