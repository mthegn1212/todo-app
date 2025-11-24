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
import { useState, useEffect } from "react";
import SortableTaskItem from "./SortableTaskItem";
import TaskItem from "./TaskItem";
import { Filter } from "lucide-react";
import type { Task } from "../api/task.api";

interface TaskListViewProps {
  tasks: Task[]; // Nhận danh sách task đã lọc từ cha
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  isDragEnabled: boolean; // Cho phép kéo thả hay không
}

const TaskListView = ({ tasks, onUpdateTask, onDeleteTask, isDragEnabled }: TaskListViewProps) => {
  // State nội bộ để UI mượt khi kéo thả
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);

  // Đồng bộ khi props thay đổi
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localTasks.findIndex((t) => t._id === active.id);
    const newIndex = localTasks.findIndex((t) => t._id === over.id);
    const newOrderedTasks = arrayMove(localTasks, oldIndex, newIndex);
    
    setLocalTasks(newOrderedTasks);

    // Logic tính toán Position
    const prevTask = newOrderedTasks[newIndex - 1];
    const nextTask = newOrderedTasks[newIndex + 1];
    let newPosition;

    if (!prevTask && !nextTask) newPosition = Date.now();
    else if (!prevTask) newPosition = nextTask.position - 1000;
    else if (!nextTask) newPosition = prevTask.position + 1000;
    else newPosition = (prevTask.position + nextTask.position) / 2;

    // Gọi lên cha để update API
    onUpdateTask(active.id as string, { position: newPosition });
  };

  if (tasks.length === 0) {
    return (
        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
            <Filter className="mx-auto text-gray-300 mb-2" size={40} />
            <p className="text-gray-500">Không tìm thấy công việc nào.</p>
        </div>
    );
  }

  // Nếu không cho kéo thả (đang search/filter) -> Render list thường
  if (!isDragEnabled) {
    return (
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskItem
            key={task._id}
            task={task}
            onToggle={(id, status) => onUpdateTask(id, { isCompleted: status })}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
    );
  }

  // Render list kéo thả
  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <SortableContext items={localTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 pb-20">
          {localTasks.map((task) => (
            <SortableTaskItem
              key={task._id}
              task={task}
              onToggle={(id, status) => onUpdateTask(id, { isCompleted: status })}
              onDelete={onDeleteTask}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
};

export default TaskListView;