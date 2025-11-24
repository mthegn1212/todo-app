import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { registerAPI } from "../api/auth.api";
import { useState } from "react";
import { User, Mail, Lock, Loader2, Sparkles } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
});

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      await registerAPI(data);
      alert("Đăng ký thành công! Hãy đăng nhập ngay.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/80 backdrop-blur-xl p-8 md:p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 mx-4">
        
        <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-purple-600 to-pink-600">
                Tham gia ngay 🚀
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Tạo tài khoản để quản lý công việc hiệu quả</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center justify-center">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name Input */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Họ tên</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  {...register("name")}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-medium"
                  placeholder="Nguyễn Văn A"
                />
            </div>
            {errors.name && <p className="text-red-500 text-xs font-semibold ml-1">{errors.name.message}</p>}
          </div>

          {/* Email Input */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Email</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  {...register("email")}
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-medium"
                  placeholder="email@example.com"
                />
            </div>
            {errors.email && <p className="text-red-500 text-xs font-semibold ml-1">{errors.email.message}</p>}
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700 ml-1">Mật khẩu</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-purple-400" />
                </div>
                <input
                  {...register("password")}
                  type="password"
                  className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 border-none rounded-xl text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all font-medium"
                  placeholder="••••••••"
                />
            </div>
            {errors.password && <p className="text-red-500 text-xs font-semibold ml-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-4 px-4 rounded-xl shadow-lg shadow-purple-200 text-base font-bold text-white bg-linear-to-r from-purple-600 to-pink-600 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : (
                <>Đăng Ký Ngay <Sparkles size={20} className="ml-2" /></>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 font-medium">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-purple-600 hover:text-purple-700 font-bold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;