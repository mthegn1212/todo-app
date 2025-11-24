import { useMemo, useState, useEffect } from "react";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  parseISO,
  addWeeks,
  subWeeks
} from "date-fns";
import { vi } from "date-fns/locale";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  defaultDropAnimationSideEffects,
  type DropAnimation,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableTaskItem from "./SortableTaskItem";
import TaskItem from "./TaskItem";
import type { Task } from "../api/task.api";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

interface WeeklyColumnProps {
  day: Date;
  tasks: Task[];
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onQuickAdd: (dateStr: string) => void;
}

const WeeklyColumn = ({ day, tasks, onUpdateTask, onDeleteTask, onQuickAdd }: WeeklyColumnProps) => {
  const dateKey = format(day, "yyyy-MM-dd");
  const isTodayColumn = isSameDay(day, new Date());

  const { setNodeRef } = useDroppable({
    id: dateKey,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex-1 min-w-[320px] flex flex-col h-[700px] transition-all duration-300 rounded-3xl", 
        isTodayColumn 
          ? "bg-white border-2 border-indigo-200 shadow-xl shadow-indigo-100/50" 
          : "bg-white/40 border border-white/60 hover:bg-white/60" 
      )}
    >
      <div className={clsx(
        "p-5 rounded-t-3xl border-b border-slate-50 mb-2 sticky top-0 z-10 backdrop-blur-md",
        isTodayColumn ? "bg-indigo-50/80" : "bg-white/50"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={clsx(
              "w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl shadow-sm transition-transform hover:scale-110",
              isTodayColumn 
                ? "bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-300" 
                : "bg-white text-slate-700 shadow-slate-200"
            )}>
              {format(day, "dd")}
            </div>
            <div className="flex flex-col">
              <span className={clsx("text-xs font-bold uppercase tracking-widest", isTodayColumn ? "text-indigo-600" : "text-slate-400")}>
                {format(day, "EEEE", { locale: vi })}
              </span>
              {isTodayColumn && <span className="text-[10px] font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-500 to-purple-500">HÔM NAY</span>}
            </div>
          </div>
          
          <button onClick={() => onQuickAdd(dateKey)} className="w-9 h-9 flex items-center justify-center bg-white hover:bg-indigo-500 hover:text-white text-slate-300 rounded-xl shadow-sm border border-slate-100 transition-all">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <SortableContext id={dateKey} items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-3 custom-scrollbar">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task._id}
              task={task}
              onToggle={(id, status) => onUpdateTask(id, { isCompleted: status })}
              onDelete={onDeleteTask}
            />
          ))}
          
          {tasks.length === 0 && (
            <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center opacity-50 hover:opacity-100 hover:border-blue-300 transition-all bg-slate-50/50">
              <p className="text-sm font-medium text-slate-400">Trống</p>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};


// --- COMPONENT CHÍNH ---
interface WeeklyViewProps {
  tasks: Task[];
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onQuickAdd: (dateStr: string) => void;
}

const WeeklyView = ({ 
  tasks, 
  onUpdateTask, 
  onDeleteTask, 
  currentDate, 
  onDateChange, 
  onQuickAdd 
}: WeeklyViewProps) => {
  
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  useEffect(() => { setLocalTasks(tasks); }, [tasks]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const columns = useMemo(() => {
    const cols: Record<string, Task[]> = {};
    weekDays.forEach((day) => { cols[format(day, "yyyy-MM-dd")] = []; });

    localTasks.forEach((task) => {
      if (!task.dueDate) return;
      const dateKey = format(parseISO(task.dueDate), "yyyy-MM-dd");
      if (cols[dateKey]) cols[dateKey].push(task);
    });

    Object.keys(cols).forEach((key) => {
      cols[key].sort((a, b) => a.position - b.position);
    });
    return cols;
  }, [localTasks, weekDays]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTask = localTasks.find((t) => t._id === active.id);
    const overTask = localTasks.find((t) => t._id === over.id);
    
    if (!activeTask) return;

    // 1. Xác định Ngày Đích (Target Date)
    const isOverColumn = weekDays.some(day => format(day, "yyyy-MM-dd") === over.id);
    
    let targetDateStr = "";
    if (isOverColumn) {
        targetDateStr = over.id as string;
    } else if (overTask && overTask.dueDate) {
        targetDateStr = format(parseISO(overTask.dueDate), "yyyy-MM-dd");
    }

    if (!targetDateStr) return;

    // 2. Tạo danh sách giả lập cho cột đích để tính toán (Bỏ activeTask ra)
    let targetColumnTasks = localTasks.filter(t => {
        if (!t.dueDate) return false;
        const tDate = format(parseISO(t.dueDate), "yyyy-MM-dd");
        return tDate === targetDateStr && t._id !== activeTask._id;
    }).sort((a, b) => a.position - b.position);

    // 3. Xác định vị trí chèn (Index)
    let newIndex = targetColumnTasks.length; // Mặc định xuống cuối

    if (overTask && !isOverColumn) {
        const overIndex = targetColumnTasks.findIndex(t => t._id === overTask._id);
        
        // Logic so sánh vị trí để biết chèn trên hay dưới
        const isSameColumn = format(parseISO(activeTask.dueDate || ""), "yyyy-MM-dd") === targetDateStr;
        
        // Nếu cùng cột và kéo xuống -> chèn sau (+1)
        if (isSameColumn && activeTask.position < overTask.position) {
            newIndex = overIndex + 1;
        } else {
            // Khác cột hoặc kéo lên -> chèn trước
            newIndex = overIndex >= 0 ? overIndex : targetColumnTasks.length;
        }
    }

    // 4. Chèn activeTask vào danh sách giả lập
    targetColumnTasks.splice(newIndex, 0, { ...activeTask });

    // 5. Tính toán Position mới (Trung bình cộng)
    const prevTask = targetColumnTasks[newIndex - 1];
    const nextTask = targetColumnTasks[newIndex + 1];
    
    let newPosition = activeTask.position;

    if (!prevTask && !nextTask) {
        newPosition = new Date().getTime(); // Cột rỗng
    } else if (!prevTask) {
        newPosition = nextTask.position - 60000; // Lên đầu
    } else if (!nextTask) {
        newPosition = prevTask.position + 60000; // Xuống cuối
    } else {
        newPosition = (prevTask.position + nextTask.position) / 2; // Chen giữa
    }

    // 6. Tính toán Ngày mới
    const oldDate = parseISO(activeTask.dueDate || new Date().toISOString());
    const newDateObj = new Date(targetDateStr);
    newDateObj.setHours(oldDate.getHours(), oldDate.getMinutes());
    const newDateIso = newDateObj.toISOString();

    // 7. Cập nhật UI Ngay lập tức
    const hasChanged = activeTask.position !== newPosition || activeTask.dueDate !== newDateIso;
    
    if (hasChanged) {
        setLocalTasks((prev) => 
            prev.map((t) => 
                t._id === activeTask._id 
                    ? { ...t, dueDate: newDateIso, position: newPosition } 
                    : t
            )
        );

        onUpdateTask(activeTask._id, { 
            dueDate: newDateIso,
            position: newPosition 
        });
    }
  };

  const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }),
  };

  return (
    <div className="flex flex-col h-full">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-xl shadow-sm border">
        <div className="flex items-center gap-2">
            <button onClick={() => onDateChange(subWeeks(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft /></button>
            <span className="font-bold text-lg text-gray-700 min-w-[200px] text-center">{format(weekDays[0], "dd/MM")} - {format(weekDays[6], "dd/MM/yyyy")}</span>
            <button onClick={() => onDateChange(addWeeks(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight /></button>
        </div>
        <button onClick={() => onDateChange(new Date())} className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1 rounded-lg">Về hôm nay</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto custom-scrollbar pb-4 flex-1">
          <div className="flex gap-4 min-w-[1200px] h-full"> 
            {weekDays.map((day) => (
               <WeeklyColumn 
                  key={day.toISOString()}
                  day={day}
                  tasks={columns[format(day, "yyyy-MM-dd")] || []}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                  onQuickAdd={onQuickAdd}
               />
            ))}
          </div>
        </div>
        <DragOverlay dropAnimation={dropAnimation}>
          {activeId ? (
            <div className="opacity-80 rotate-2 cursor-grabbing w-[300px]">
               <TaskItem task={localTasks.find(t => t._id === activeId)!} onToggle={() => {}} onDelete={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default WeeklyView;