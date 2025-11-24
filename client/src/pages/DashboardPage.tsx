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
import { useState, useEffect, useMemo } from "react";
import {
  getTasksAPI,
  createTaskAPI,
  updateTaskAPI,
  deleteTaskAPI,
  type Task,
} from "../api/task.api";
import SortableTaskItem from "../components/SortableTaskItem";
import TaskItem from "../components/TaskItem";
import ProgressBar from "../components/ProgressBar";
import { LogOut, Plus, Loader2, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State Input
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  
  // State Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");

  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // 1. Fetch API
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: getTasksAPI,
  });

  useEffect(() => {
    if (tasks.length > 0) {
      setLocalTasks(tasks);
    }
  }, [tasks]);

  // 2. Logic Lọc & Tìm kiếm (Xử lý ở Client cho nhanh)
  const filteredTasks = useMemo(() => {
    return localTasks.filter((task) => {
      // Lọc theo Search
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      // Lọc theo Trạng thái
      const matchesFilter = 
        filterStatus === "all" ? true :
        filterStatus === "completed" ? task.isCompleted :
        !task.isCompleted;

      return matchesSearch && matchesFilter;
    });
  }, [localTasks, searchTerm, filterStatus]);

  // Tính toán tiến độ
  const totalTasks = localTasks.length;
  const completedTasks = localTasks.filter(t => t.isCompleted).length;

  // Setup Drag Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: (data: { title: string; dueDate?: string }) => createTaskAPI(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTaskTitle("");
      setNewTaskDate("");
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Task> }) => updateTaskAPI(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTaskAPI,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });

  // Xử lý kéo thả (Chỉ chạy khi đang ở chế độ "All" và không tìm kiếm)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localTasks.findIndex((t) => t._id === active.id);
    const newIndex = localTasks.findIndex((t) => t._id === over.id);
    const newOrderedTasks = arrayMove(localTasks, oldIndex, newIndex);
    
    setLocalTasks(newOrderedTasks);

    const prevTask = newOrderedTasks[newIndex - 1];
    const nextTask = newOrderedTasks[newIndex + 1];
    let newPosition;

    if (!prevTask && !nextTask) newPosition = Date.now();
    else if (!prevTask) newPosition = nextTask.position - 1000;
    else if (!nextTask) newPosition = prevTask.position + 1000;
    else newPosition = (prevTask.position + nextTask.position) / 2;

    updateTaskMutation.mutate({ id: active.id as string, data: { position: newPosition } });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({ title: newTaskTitle, dueDate: newTaskDate || new Date().toISOString() });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Kiểm tra xem có được phép kéo thả không
  const isDragEnabled = searchTerm === "" && filterStatus === "all";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Tasks 🎯</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-500 bg-white px-4 py-2 rounded-lg border shadow-sm transition-all hover:shadow">
            <LogOut size={18} /> <span className="hidden md:inline">Đăng xuất</span>
          </button>
        </div>

        {/* Thanh Tiến Độ */}
        <ProgressBar total={totalTasks} completed={completedTasks} />

        {/* Form Tạo Task */}
        <form onSubmit={handleAddTask} className="mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
             <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Thêm công việc mới..."
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

        {/* Toolbar: Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-2 z-10">
            {/* Search Box */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder="Tìm kiếm công việc..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            
            {/* Filter Tabs */}
            <div className="flex bg-white p-1 rounded-lg shadow-sm">
                {(["all", "active", "completed"] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={clsx(
                            "px-4 py-2 rounded-md text-sm font-medium transition-all capitalize",
                            filterStatus === status 
                                ? "bg-blue-100 text-blue-700 shadow-sm" 
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        )}
                    >
                        {status === "all" ? "Tất cả" : status === "active" ? "Đang làm" : "Đã xong"}
                    </button>
                ))}
            </div>
        </div>

        {/* Danh sách Task */}
        <div className="space-y-2 pb-20">
          {isLoading && localTasks.length === 0 ? (
             <div className="text-center py-10 text-gray-500"><Loader2 className="animate-spin mx-auto mb-2"/> Đang tải dữ liệu...</div>
          ) : (
            <>
                {isDragEnabled ? (
                    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
                        <SortableContext items={filteredTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                            {filteredTasks.map((task) => (
                                <SortableTaskItem
                                    key={task._id}
                                    task={task}
                                    onToggle={(id, status) => updateTaskMutation.mutate({ id, data: { isCompleted: status } })}
                                    onDelete={(id) => deleteTaskMutation.mutate(id)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                ) : (
                    filteredTasks.map((task) => (
                        <TaskItem
                            key={task._id}
                            task={task}
                            onToggle={(id, status) => updateTaskMutation.mutate({ id, data: { isCompleted: status } })}
                            onDelete={(id) => deleteTaskMutation.mutate(id)}
                        />
                    ))
                )}
                
                {filteredTasks.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                        <Filter className="mx-auto text-gray-300 mb-2" size={40} />
                        <p className="text-gray-500">Không tìm thấy công việc nào phù hợp.</p>
                    </div>
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;