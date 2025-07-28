export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResponse {
  user: UserData;
  token: string;
}