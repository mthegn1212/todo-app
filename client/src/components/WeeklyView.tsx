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

  // Biến cột thành vùng thả
  const { setNodeRef } = useDroppable({
    id: dateKey,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        "flex-1 min-w-[280px] bg-gray-100 rounded-xl p-3 flex flex-col h-[600px]",
        isTodayColumn ? "ring-2 ring-blue-500 bg-blue-50" : ""
      )}
    >
      {/* Header Cột */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className={clsx("text-xs font-bold uppercase", isTodayColumn ? "text-blue-600" : "text-gray-500")}>
            {format(day, "EEEE", { locale: vi })}
          </p>
          <p className={clsx("text-lg font-bold", isTodayColumn ? "text-blue-700" : "text-gray-700")}>
            {format(day, "dd/MM")}
          </p>
        </div>
        <button onClick={() => onQuickAdd(dateKey)} className="p-1.5 bg-white hover:bg-blue-100 text-blue-600 rounded-lg shadow-sm border transition-colors">
            <Plus size={16} />
        </button>
      </div>

      {/* Danh sách Task */}
      <SortableContext id={dateKey} items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar min-h-[100px]">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task._id}
              task={task}
              onToggle={(id, status) => onUpdateTask(id, { isCompleted: status })}
              onDelete={onDeleteTask}
            />
          ))}
          
          {/* Placeholder ẩn hiện khi rỗng để người dùng biết là thả được */}
          {tasks.length === 0 && (
             <div className="h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center opacity-40">
                <p className="text-xs text-gray-400 select-none">Thả vào đây</p>
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
        // Nếu thả vào vùng trống (over.id là dateKey) -> Lấy dateKey đó
        // Nếu thả vào task (over.id là taskId) -> Lấy dueDate của task đó
        const isOverColumn = weekDays.some(day => format(day, "yyyy-MM-dd") === over.id);
        
        let targetDateStr = "";
        if (isOverColumn) {
            targetDateStr = over.id as string;
        } else if (overTask && overTask.dueDate) {
            targetDateStr = format(parseISO(overTask.dueDate), "yyyy-MM-dd");
        }

        if (!targetDateStr) return;

        // 2. Tạo danh sách giả lập cho cột đích để tính toán
        // Lấy tất cả task của ngày đích, TRỪ thằng đang kéo (để tí chèn vào sau)
        let targetColumnTasks = localTasks.filter(t => {
            if (!t.dueDate) return false;
            const tDate = format(parseISO(t.dueDate), "yyyy-MM-dd");
            return tDate === targetDateStr && t._id !== activeTask._id;
        }).sort((a, b) => a.position - b.position);

        // 3. Xác định vị trí chèn (Index)
        let newIndex = targetColumnTasks.length; // Mặc định xuống cuối

        if (overTask && !isOverColumn) {
            // Nếu thả đè lên task khác, tìm vị trí của task đó
            const overIndex = targetColumnTasks.findIndex(t => t._id === overTask._id);
            
            // Logic thông minh: 
            // - Nếu đang kéo cùng cột và kéo XUỐNG (active.pos < over.pos) -> Chèn sau (+1)
            // - Nếu đang kéo cùng cột và kéo LÊN (active.pos > over.pos) -> Chèn trước
            // - Nếu khác cột -> Mặc định chèn trước
            const isSameColumn = format(parseISO(activeTask.dueDate || ""), "yyyy-MM-dd") === targetDateStr;
            
            if (isSameColumn && activeTask.position < overTask.position) {
                newIndex = overIndex + 1;
            } else {
                newIndex = overIndex >= 0 ? overIndex : targetColumnTasks.length;
            }
        }

        // 4. Chèn activeTask vào danh sách giả lập ở vị trí mới
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

        // 6. Tính toán Ngày mới (Giữ giờ cũ, đổi ngày)
        const oldDate = parseISO(activeTask.dueDate || new Date().toISOString());
        const newDateObj = new Date(targetDateStr);
        newDateObj.setHours(oldDate.getHours(), oldDate.getMinutes());
        const newDateIso = newDateObj.toISOString();

        // 7. Cập nhật UI Ngay lập tức (Optimistic)
        const hasChanged = activeTask.position !== newPosition || activeTask.dueDate !== newDateIso;
        
        if (hasChanged) {
            setLocalTasks((prev) => 
                prev.map((t) => 
                    t._id === activeTask._id 
                        ? { ...t, dueDate: newDateIso, position: newPosition } 
                        : t
                )
            );

            // 8. Gọi API
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
               // Render Component Cột Đã Tách
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
            <div className="opacity-80 rotate-2 cursor-grabbing w-[280px]">
               <TaskItem task={localTasks.find(t => t._id === activeId)!} onToggle={() => {}} onDelete={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default WeeklyView;