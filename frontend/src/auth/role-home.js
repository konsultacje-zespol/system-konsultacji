// the first page each role sees after login (and when they click the logo)
export function roleHome(role) {
  if (role === 'STUDENT') {
    return '/student/dashboard';
  }
  if (role === 'LECTURER') {
    return '/lecturer/schedule';
  }
  if (role === 'ADMIN') {
    return '/admin/seed';
  }
  return '/login';
}
