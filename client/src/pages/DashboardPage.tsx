import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { getTasksAPI, createTaskAPI, updateTaskAPI, deleteTaskAPI, type Task } from "../api/task.api";
import TaskItem from "../components/TaskItem";
import { LogOut, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  // 1. Lấy danh sách Task từ Server
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"], 
    queryFn: getTasksAPI,
  });

  // 2. Hàm tạo Task
  const createTaskMutation = useMutation({
    mutationFn: createTaskAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] }); // Load lại list ngay lập tức
      setNewTaskTitle("");
    },
  });

  // 3. Hàm sửa Task (Tick xong/chưa xong)
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) =>
      updateTaskAPI(id, { isCompleted }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // 4. Hàm xóa Task
  const deleteTaskMutation = useMutation({
    mutationFn: deleteTaskAPI,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate(newTaskTitle);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header: Tiêu đề + Logout */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Tasks 📝</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-red-500 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border"
          >
            <LogOut size={18} />
            <span className="hidden md:inline font-medium">Đăng xuất</span>
          </button>
        </div>

        {/* Input thêm mới */}
        <form onSubmit={handleAddTask} className="mb-8 relative">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Hôm nay bạn cần làm gì?"
            className="w-full p-4 pl-5 pr-14 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-lg"
            disabled={createTaskMutation.isPending}
          />
          <button
            type="submit"
            disabled={createTaskMutation.isPending || !newTaskTitle.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {createTaskMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          </button>
        </form>

        {/* Danh sách công việc */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-10 text-gray-500 flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-blue-500" size={30} />
                <p>Đang tải danh sách...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400 text-lg">Bạn rảnh rỗi quá nhỉ? Thêm việc đi! 😎</p>
            </div>
          ) : (
            tasks.map((task: Task) => (
              <TaskItem
                key={task._id}
                task={task}
                onToggle={(id, status) => updateTaskMutation.mutate({ id, isCompleted: status })}
                onDelete={(id) => deleteTaskMutation.mutate(id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;