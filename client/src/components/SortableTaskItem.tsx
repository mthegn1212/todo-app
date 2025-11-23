import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import TaskItem from "./TaskItem";
import type { Task } from "../api/task.api";

interface SortableProps {
  task: Task;
  onToggle: (id: string, status: boolean) => void;
  onDelete: (id: string) => void;
}

const SortableTaskItem = ({ task, onToggle, onDelete }: SortableProps) => {
  // Hook của dnd-kit giúp item này có thể kéo được
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Kiểm tra xem có đang bị kéo không
  } = useSortable({ id: task._id });

  // Style để item di chuyển theo chuột
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1, // Làm mờ khi đang kéo
    zIndex: isDragging ? 1000 : "auto", // Nổi lên trên cùng khi kéo
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
       {/* Render lại TaskItem cũ nhưng đã được bọc logic kéo thả */}
      <TaskItem task={task} onToggle={onToggle} onDelete={onDelete} />
    </div>
  );
};

export default SortableTaskItem;