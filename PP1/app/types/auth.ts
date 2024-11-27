export interface User {
  avatar: string;
  firstname: string;
  lastname: string;
  email: string;
  phoneNumber: string;
  username: string;
  id: number;
  role: string;
  about: string;
}

export interface TokenVerification {
  valid: boolean;
  reason?: string;
  decoded?: {
    id: number;
    role: string;
    exp?: number;
    username?: string;
  };
};

export interface TokenPayload {
  id: number;
  role: string;
  username?: string;
  exp?: number;
}