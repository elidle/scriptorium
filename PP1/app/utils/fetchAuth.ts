import { User } from '../types/auth';
import { refreshToken } from './auth';

type FetchAuthParams = {
  url: string;
  options: RequestInit;
  user: User;
  setAccessToken: (token: string) => void;
  router: any;
};

// This util function is used to fetch data with auth.
// It handles refreshing access token if needed.
export async function fetchAuth({
  url,
  options,
  user,
  setAccessToken,
  router
}: FetchAuthParams) {
  let response = await fetch(url, options);

  if (response.status === 401) {
    const refreshResponse = await refreshToken(user);
    
    if (!refreshResponse.ok && refreshResponse.status === 401) {
      router.push('/auth/login');
      return null;
    }
    
    const newToken = refreshResponse['access-token'];
    setAccessToken(newToken);
    
    options.headers = {
      ...options.headers,
      'access-token': `Bearer ${newToken}`
    };
    
    response = await fetch(url, options);
  }

  return response;
}