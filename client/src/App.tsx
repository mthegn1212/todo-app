import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

// Component Bảo vệ: Không có Token -> Cho về Login
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("token");
  
  if (!token) {
    // replace: true để user không bấm Back quay lại được
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes (Ai cũng vào được) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* 🔒 Private Routes (Phải đăng nhập mới thấy) */}
        <Route path="/" element={
          <ProtectedRoute>
             <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h1 className="text-4xl font-bold text-green-600 mb-4">🎉 Dashboard</h1>
                <p className="text-gray-600 text-lg">Chào mừng bạn đã đăng nhập thành công!</p>
                <p className="text-gray-500 mb-8">Token của bạn đang được bảo vệ an toàn.</p>
                
                <button 
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.reload(); // Reload để Router check lại token
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow transition"
                >
                  Đăng xuất (Logout)
                </button>
             </div>
          </ProtectedRoute>
        } />

        {/* Đường dẫn lạ -> Cho về Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;