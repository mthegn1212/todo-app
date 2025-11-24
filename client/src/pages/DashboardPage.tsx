import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useRef } from "react";
import {
  getTasksAPI,
  createTaskAPI,
  updateTaskAPI,
  deleteTaskAPI,
  type Task,
} from "../api/task.api";
import TaskListView from "../components/TaskListView";
import WeeklyView from "../components/WeeklyView";
import ProgressBar from "../components/ProgressBar";
import { LogOut, Plus, Loader2, Search, List, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

const DashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const titleInputRef = useRef<HTMLInputElement>(null);

  // State UI
  const [viewMode, setViewMode] = useState<"list" | "week">("list");
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDate, setNewTaskDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("all");

  // API & Mutations (Giữ nguyên)
  const { data: tasks = [], isLoading } = useQuery({ queryKey: ["tasks"], queryFn: getTasksAPI });

  const createTaskMutation = useMutation({
    mutationFn: (data: { title: string; dueDate?: string }) => createTaskAPI(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewTaskTitle("");
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

  // Logic Filter
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === "all" ? true : filterStatus === "completed" ? task.isCompleted : !task.isCompleted;
      return matchesSearch && matchesFilter;
    });
  }, [tasks, searchTerm, filterStatus]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({ title: newTaskTitle, dueDate: newTaskDate || new Date().toISOString() });
  };

  const handleQuickAdd = (dateStr: string) => {
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    setNewTaskDate(`${dateStr}T${timeString}`);
    
    titleInputRef.current?.focus();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => { localStorage.clear(); navigate("/login"); };
  const isDragEnabled = searchTerm === "" && filterStatus === "all";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header & Progress Bar */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">My Planner 📅</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-600 hover:text-red-500 bg-white px-4 py-2 rounded-lg border shadow-sm"><LogOut size={18} /> <span className="hidden md:inline">Đăng xuất</span></button>
        </div>
        <ProgressBar total={tasks.length} completed={tasks.filter(t => t.isCompleted).length} />

        {/* FORM ADD TASK (Giữ nguyên, chỉ thêm ref) */}
        <form onSubmit={handleAddTask} className="mb-6 flex flex-col md:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-blue-100">
          <div className="relative flex-1">
             <input
              ref={titleInputRef}
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Thêm công việc mới..."
              className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={createTaskMutation.isPending}
            />
          </div>
          <div className="relative">
            <input 
              type="datetime-local" 
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="w-full md:w-auto p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-none text-gray-600 cursor-pointer"
            />
          </div>
          <button type="submit" disabled={createTaskMutation.isPending || !newTaskTitle.trim()} className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors shadow-sm flex items-center justify-center min-w-[50px]">
            {createTaskMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
          </button>
        </form>

        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-2 z-10">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder="Tìm kiếm..."
                    value={searchTerm}
                    onChange={(e) => {
                        const value = e.target.value;
                        setSearchTerm(value);
                        
                        if (value.trim().length > 0) {
                            setViewMode("list");
                        }
                    }}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <div className="flex gap-2">
                <div className="flex bg-white p-1 rounded-lg shadow-sm">
                    {(["all", "active", "completed"] as const).map((status) => (
                        <button key={status} onClick={() => setFilterStatus(status)} className={clsx("px-3 py-2 rounded-md text-sm font-medium transition-all capitalize", filterStatus === status ? "bg-blue-100 text-blue-700 shadow-sm" : "text-gray-500 hover:bg-gray-50")}>{status === "all" ? "All" : status}</button>
                    ))}
                </div>
                <div className="flex bg-gray-200 p-1 rounded-lg shadow-inner">
                   <button onClick={() => setViewMode("list")} className={clsx("p-2 rounded-md transition-all flex items-center gap-1 text-sm font-medium", viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}><List size={18} /><span className="hidden sm:inline">List</span></button>
                   <button onClick={() => setViewMode("week")} className={clsx("p-2 rounded-md transition-all flex items-center gap-1 text-sm font-medium", viewMode === "week" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}><CalendarDays size={18} /><span className="hidden sm:inline">Week</span></button>
                </div>
            </div>
        </div>

        {/* RENDER VIEW */}
        {isLoading ? (
             <div className="text-center py-10 text-gray-500"><Loader2 className="animate-spin mx-auto mb-2"/> Đang tải...</div>
        ) : viewMode === "list" ? (
             <TaskListView 
                tasks={filteredTasks} 
                isDragEnabled={isDragEnabled}
                onUpdateTask={(id, data) => updateTaskMutation.mutate({ id, data })}
                onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
             />
        ) : (
             <WeeklyView 
                tasks={filteredTasks}
                onUpdateTask={(id, data) => updateTaskMutation.mutate({ id, data })}
                onDeleteTask={(id) => deleteTaskMutation.mutate(id)}
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onQuickAdd={handleQuickAdd}
             />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;