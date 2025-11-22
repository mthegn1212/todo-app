import { Check, Trash2, Calendar } from "lucide-react";
import { type Task } from "../api/task.api";
import clsx from "clsx";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, status: boolean) => void;
  onDelete: (id: string) => void;
}

const TaskItem = ({ task, onToggle, onDelete }: TaskItemProps) => {
  return (
    <div className="group flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all mb-3">
      <div className="flex items-center gap-3 flex-1">
        {/* Nút Checkbox tròn */}
        <button
          onClick={() => onToggle(task._id, !task.isCompleted)}
          className={clsx(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
            task.isCompleted
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-green-500"
          )}
        >
          {task.isCompleted && <Check size={14} className="text-white" />}
        </button>

        {/* Tên Task */}
        <div className="flex flex-col">
          <span
            className={clsx(
              "text-gray-800 font-medium transition-all break-all",
              task.isCompleted && "line-through text-gray-400"
            )}
          >
            {task.title}
          </span>
          
          {/* Ngày tháng (nếu có) */}
          {task.dueDate && (
            <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <Calendar size={12} />
              {new Date(task.dueDate).toLocaleDateString("vi-VN")}
            </span>
          )}
        </div>
      </div>

      {/* Nút xóa (chỉ hiện khi hover) */}
      <button
        onClick={() => onDelete(task._id)}
        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};

export default TaskItem;