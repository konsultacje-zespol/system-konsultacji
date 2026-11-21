import axios from 'axios';

export const http = axios.create({
  baseURL: '/api/v1',
});

function handleResponseError(error) {
  const status = error.response ? error.response.status : null;
  const url = error.config ? error.config.url : null;

  // redirect to login on 401 errors, except for the guest session check (/auth/me)
  if (status === 401 && url !== '/auth/me') {
    window.location.href = '/login';
  }

  // forward the error so calling code can still handle it
  return Promise.reject(error);
}

// register the response error interceptor globally on the HTTP client
http.interceptors.response.use((response) => response, handleResponseError);