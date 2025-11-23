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
  return (
    <div className="group flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all mb-3">
      <div className="flex items-center gap-3 flex-1">
        {/* Nút Checkbox */}
        <button
          // Chặn sự kiện kéo thả lan vào checkbox
          onPointerDown={(e) => e.stopPropagation()} 
          onClick={() => onToggle(task._id, !task.isCompleted)}
          className={clsx(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 cursor-pointer",
            task.isCompleted
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-green-500"
          )}
        >
          {task.isCompleted && <Check size={14} className="text-white" />}
        </button>

        {/* Nội dung Task */}
        <div className="flex flex-col">
          <span
            className={clsx(
              "text-gray-800 font-medium transition-all break-all",
              task.isCompleted && "line-through text-gray-400"
            )}
          >
            {task.title}
          </span>
          
          {task.dueDate && (
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                <Calendar size={12} />
                {format(new Date(task.dueDate), "dd/MM/yyyy")}
              </span>
              
              <span className="text-xs text-blue-500 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded">
                <Clock size={12} />
                {format(new Date(task.dueDate), "HH:mm")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nút xóa */}
      <button
        // Giúp nút xóa hoạt động khi đang dùng dnd-kit, tránh tình trạng bị đè bởi dnd-kit
        onPointerDown={(e) => e.stopPropagation()} 
        onClick={() => {
            if(window.confirm("Bạn có chắc muốn xóa task này không?")) {
                onDelete(task._id);
            }
        }}
        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2 cursor-pointer"
        title="Xóa công việc"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default TaskItem;