import { Check, Trash2, Calendar, Clock } from "lucide-react";
import type { Task } from "../api/task.api";
import clsx from "clsx";
import { format } from "date-fns";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, status: boolean) => void;
  onDelete: (id: string) => void;
}

const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => {
  // Logic kiểm tra xem task đã quá hạn chưa
  const isOverdue = !task.isCompleted && task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <div className={clsx(
      "group relative flex items-center justify-between p-4 mb-3 transition-all duration-200 ease-in-out",
      "bg-white rounded-2xl",
      "shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
      "border border-transparent hover:border-blue-100",
      "transform hover:-translate-y-0.5"
    )}>
      
      {/* Cạnh màu đánh dấu trạng thái (Trang trí) */}
      <div className={clsx(
        "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-colors",
        task.isCompleted ? "bg-green-400" : isOverdue ? "bg-red-400" : "bg-blue-400"
      )} />

      <div className="flex items-center gap-4 flex-1 pl-3">
        {/* Custom Checkbox xịn hơn */}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onToggle(task._id, !task.isCompleted)}
          className={clsx(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 shrink-0",
            task.isCompleted
              ? "bg-green-500 border-green-500 scale-105"
              : "border-slate-300 hover:border-blue-400 bg-slate-50"
          )}
        >
          <Check size={14} className={clsx("text-white transition-transform", task.isCompleted ? "scale-100" : "scale-0")} />
        </button>

        <div className="flex flex-col gap-1">
          <span
            className={clsx(
              "font-semibold text-slate-700 transition-all",
              task.isCompleted && "line-through text-slate-400 decoration-slate-300"
            )}
          >
            {task.title}
          </span>
          
          {task.dueDate && (
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className={clsx("flex items-center gap-1.5 px-2 py-1 rounded-md", 
                 isOverdue ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-500"
              )}>
                <Calendar size={12} />
                {format(new Date(task.dueDate), "dd/MM")}
              </span>
              
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-500">
                <Clock size={12} />
                {format(new Date(task.dueDate), "HH:mm")}
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => { if(window.confirm("Xóa nhé?")) onDelete(task._id); }}
        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default TaskItem;