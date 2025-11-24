import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { loginAPI } from "../api/auth.api";
import { useState } from "react";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
});

type LoginForm = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      const res = await loginAPI(data);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/"); 
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Card Glassmorphism */}
      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 mx-4">
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600">
                Welcome Back! 👋
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Đăng nhập để tiếp tục quản lý công việc</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center justify-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Email</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-indigo-400" />
                </div>
                <input
                  {...register("email")}
                  type="email"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  placeholder="name@example.com"
                />
            </div>
            {errors.email && <p className="text-red-500 text-xs font-semibold ml-1">{errors.email.message}</p>}
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Mật khẩu</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-indigo-400" />
                </div>
                <input
                  {...register("password")}
                  type="password"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                />
            </div>
            {errors.password && <p className="text-red-500 text-xs font-semibold ml-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-indigo-200 text-base font-bold text-white bg-linear-to-r from-indigo-600 to-purple-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : (
                <>Đăng Nhập <ArrowRight size={20} className="ml-2" /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 font-medium">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline">
              Tạo tài khoản mới
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;