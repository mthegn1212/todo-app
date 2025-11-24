interface ProgressBarProps {
  total: number;
  completed: number;
}

const ProgressBar = ({ total, completed }: ProgressBarProps) => {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm font-medium text-gray-600 mb-2">
        <span>Tiến độ công việc</span>
        <span>{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-right">
        Đã xong {completed}/{total} task
      </p>
    </div>
  );
};

export default ProgressBar;