import axios from 'axios';

export function getErrorCode(error) {
  if (!axios.isAxiosError(error)) {
    return 'INTERNAL_ERROR';
  }

  if (!error.response) {
    return 'NETWORK_ERROR';
  }

  // return the custom error code from the response payload if present
  const data = error.response.data;
  if (data && typeof data.code === 'string') {
    return data.code;
  }

  return 'INTERNAL_ERROR';
}
