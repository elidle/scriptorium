import { User } from '../types/auth';

// This util function is used to refresh the access token.
export async function refreshToken(user: User) {
  const response = await fetch('/api/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'refresh-token': localStorage.getItem('refreshToken') || '',
    },
    body: JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role
    })
  });

  if (!response.ok) throw new Error('Failed to refresh token');
  
  const data = await response.json();
  return data['access-token'];
}