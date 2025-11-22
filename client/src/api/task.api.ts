import axiosClient from "./axiosClient";

export interface Task {
  _id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
  position: number;
}

// Lấy danh sách task
export const getTasksAPI = async () => {
  const response = await axiosClient.get<Task[]>("/tasks");
  return response.data;
};

// Tạo task mới
export const createTaskAPI = async (title: string) => {
  const response = await axiosClient.post<Task>("/tasks", { title });
  return response.data;
};

// Update task (đổi tên, tick xong, đổi vị trí...)
export const updateTaskAPI = async (id: string, data: Partial<Task>) => {
  const response = await axiosClient.put<Task>(`/tasks/${id}`, data);
  return response.data;
};

// Xóa task
export const deleteTaskAPI = async (id: string) => {
  const response = await axiosClient.delete(`/tasks/${id}`);
  return response.data;
};