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
    <div className="min-h-screen p-3 md:p-8 selection:bg-indigo-100 selection:text-indigo-700 pb-20 md:pb-8"> {/* Giảm padding mobile, thêm padding bottom để không bị che bởi thanh điều hướng ảo của điện thoại */}
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8"> 
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
              <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 mb-1 md:mb-2">
                My Planner
              </h1>
              <p className="text-slate-500 font-medium text-sm md:text-base">Quản lý công việc, kiến tạo tương lai ✨</p>
          </div>
          
          {/* Nút logout nhỏ gọn hơn trên mobile */}
          <button onClick={handleLogout} className="self-end md:self-auto flex items-center gap-2 text-slate-500 hover:text-red-500 bg-white/80 backdrop-blur-sm px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-sm hover:shadow-md transition-all border border-white text-sm md:text-base">
            <LogOut size={16} className="md:w-[18px] md:h-[18px]" /> <span className="font-semibold">Thoát</span>
          </button>
        </div>

        <ProgressBar total={tasks.length} completed={tasks.filter(t => t.isCompleted).length} />

        <form onSubmit={handleAddTask} className="flex flex-col md:flex-row gap-3 p-3 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 ring-4 ring-slate-50/50">
          <div className="relative flex-1">
             <input
              ref={titleInputRef}
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="✨ Thêm việc mới..."
              className="w-full h-full px-4 py-3 md:px-6 md:py-4 bg-transparent text-base md:text-lg font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
              disabled={createTaskMutation.isPending}
            />
          </div>
          <div className="flex justify-between md:justify-start items-center gap-2">
            <input 
              type="datetime-local" 
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="flex-1 md:flex-none px-3 py-2 md:px-4 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 text-xs md:text-sm font-semibold cursor-pointer border-none focus:ring-0 transition-colors"
            />
            <button type="submit" disabled={createTaskMutation.isPending || !newTaskTitle.trim()} className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center transition-all active:scale-95 shrink-0">
              {createTaskMutation.isPending ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
            </button>
          </div>
        </form>

        <div className="flex flex-col md:flex-row gap-3 sticky top-2 z-30 bg-white/80 backdrop-blur-xl p-2 rounded-2xl shadow-sm border border-white/50">
            <div className="relative flex-1">
                <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                <input type="text" placeholder="Tìm nhanh..." value={searchTerm} onChange={(e) => {setSearchTerm(e.target.value); if(e.target.value) setViewMode('list')}} className="w-full pl-10 md:pl-12 pr-4 py-2 md:py-2.5 bg-slate-50/50 hover:bg-slate-100/50 focus:bg-white rounded-xl border-none focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-600 text-sm md:text-base" />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                    {(["all", "active", "completed"] as const).map((status) => (
                        <button key={status} onClick={() => setFilterStatus(status)} className={clsx("px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all capitalize whitespace-nowrap", filterStatus === status ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}>{status === "all" ? "Tất cả" : status}</button>
                    ))}
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                   <button onClick={() => setViewMode("list")} className={clsx("px-3 py-1.5 md:px-3 md:py-2 rounded-lg transition-all flex items-center gap-2 text-xs md:text-sm font-bold", viewMode === "list" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}><List size={16} /> List</button>
                   <button onClick={() => setViewMode("week")} className={clsx("px-3 py-1.5 md:px-3 md:py-2 rounded-lg transition-all flex items-center gap-2 text-xs md:text-sm font-bold", viewMode === "week" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}><CalendarDays size={16} /> Week</button>
                </div>
            </div>
        </div>

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