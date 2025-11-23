import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  getTasksAPI,
  createTaskAPI,
  updateTaskAPI,
  deleteTaskAPI,
  type Task,
} from "../api/task.api";
import SortableTaskItem from "../components/SortableTaskItem";
import { LogOut, Plus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  
  // State nội bộ để lưu tasks (để kéo thả mượt mà không cần chờ API)
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // 1. Fetch API
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasksAPI,
  });

  // Đồng bộ state nội bộ với dữ liệu từ Server
  useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  // Setup cảm biến kéo thả (Chuột + Phím)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Mutations
  const createTaskMutation = useMutation({
      mutationFn: (data: { title: string; dueDate?: string }) => createTaskAPI(data),    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTaskTitle("");
      setNewTaskDate("");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) =>
      updateTaskAPI(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTaskAPI,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // LOGIC KÉO THẢ
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // 1. Tìm vị trí cũ và mới
    const oldIndex = localTasks.findIndex((t) => t._id === active.id);
    const newIndex = localTasks.findIndex((t) => t._id === over.id);

    // 2. Cập nhật UI ngay lập tức (cho mượt)
    const newOrderedTasks = arrayMove(localTasks, oldIndex, newIndex);
    setLocalTasks(newOrderedTasks);

    // 3. Tính toán Position mới để gửi lên Server
    const prevTask = newOrderedTasks[newIndex - 1];
    const nextTask = newOrderedTasks[newIndex + 1];

    let newPosition;
    if (!prevTask && !nextTask) {
      newPosition = Date.now(); // List có 1 mình nó
    } else if (!prevTask) {
       // Kéo lên đầu: Lấy thằng sau trừ bớt đi
      newPosition = nextTask.position - 1000; 
    } else if (!nextTask) {
       // Kéo xuống cuối: Lấy thằng trước cộng thêm
      newPosition = prevTask.position + 1000;
    } else {
      // Kéo vào giữa: (Trước + Sau) / 2
      newPosition = (prevTask.position + nextTask.position) / 2;
    }

    updateTaskMutation.mutate({
      id: active.id as string,
      data: { position: newPosition },
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    createTaskMutation.mutate({ 
      title: newTaskTitle, 
      dueDate: newTaskDate || new Date().toISOString() 
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Tasks 📝</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-500 bg-white px-4 py-2 rounded-lg border shadow-sm">
            <LogOut size={18} /> <span className="hidden md:inline">Đăng xuất</span>
          </button>
        </div>

        <form onSubmit={handleAddTask} className="mb-8 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
             <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Nội dung công việc..."
              className="w-full p-4 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={createTaskMutation.isPending}
            />
          </div>
          
          <div className="relative">
            <input 
              type="datetime-local" 
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="w-full md:w-auto p-4 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 cursor-pointer"
              step="60"
            />
          </div>

          <button
            type="submit"
            disabled={createTaskMutation.isPending || !newTaskTitle.trim()}
            className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm flex items-center justify-center min-w-[60px]"
          >
            {createTaskMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
          </button>
        </form>

        <div className="space-y-2">
          {isLoading && localTasks.length === 0 ? (
             <div className="text-center py-10 text-gray-500"><Loader2 className="animate-spin mx-auto mb-2"/> Đang tải...</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={localTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                {localTasks.map((task) => (
                  <SortableTaskItem
                    key={task._id}
                    task={task}
                    onToggle={(id, status) => updateTaskMutation.mutate({ id, data: { isCompleted: status } })}
                    onDelete={(id) => deleteTaskMutation.mutate(id)}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
          
          {!isLoading && localTasks.length === 0 && (
             <p className="text-center text-gray-400 py-10">Chưa có task nào. Thêm đi bạn ơi!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;