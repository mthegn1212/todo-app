import axiosClient from "./axiosClient";

// Định nghĩa kiểu dữ liệu đầu vào/ra
export interface AuthPayload {
  name?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const registerAPI = (data: AuthPayload) => {
  return axiosClient.post<AuthResponse>("/auth/register", data);
};

export const loginAPI = (data: AuthPayload) => {
  return axiosClient.post<AuthResponse>("/auth/login", data);
};