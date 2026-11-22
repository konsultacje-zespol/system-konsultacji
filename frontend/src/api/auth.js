import { http } from './http.js';

// fetch the currently logged-in user, returning null if unauthenticated
export async function getMe() {
  try {
    const response = await http.get('/auth/me');
    return response.data;
  } catch (error) {
    // treat 401 as a guest session rather than an unexpected error
    if (error.response && error.response.status === 401) {
      return null;
    }
    throw error;
  }
}

// fetch demo accounts (featured quick-login buttons and the full user list)
export async function getMockUsers() {
  const response = await http.get('/auth/mock-users');
  return response.data;
}

// authenticate as a selected demo user by id
export async function mockLogin(userId) {
  const response = await http.post('/auth/mock-login', { userId });
  return response.data;
}

// end the current user session on the server
export async function logout() {
  await http.post('/auth/logout');
}