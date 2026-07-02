export interface LoginRequest {
  username: string;
  password?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    userName?: string;
    permissions?: string[];
  };
}
