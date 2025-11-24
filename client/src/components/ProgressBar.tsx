interface ProgressBarProps {
  total: number;
  completed: number;
}

const ProgressBar = ({ total, completed }: ProgressBarProps) => {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="bg-white/60 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-white/50 mb-8">
      <div className="flex justify-between text-sm font-bold text-slate-600 mb-2 uppercase tracking-wide">
        <span>Tiến độ tuần này</span>
        <span className="text-indigo-600">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
        <div
          className="bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <p className="text-xs text-slate-400 mt-3 text-right font-medium">
        Đã hoàn thành {completed}/{total} công việc
      </p>
    </div>
  );
};

export default ProgressBar;