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
  };
};