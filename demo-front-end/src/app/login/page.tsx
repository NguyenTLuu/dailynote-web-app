"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.clear();
    if (typeof window !== "undefined" && sessionStorage.getItem("sessionExpired") === "true") {
      toast.error("Phiên đăng nhập đã hết hạn");
      sessionStorage.removeItem("sessionExpired");
    }
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post("/api/auth/login", { email, password });
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);
      
      router.push("/");
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại."
      );
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async (idToken: string) => {
      const response = await api.post("/api/auth/google", { idToken });
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("username", data.username);
      if (data.role) localStorage.setItem("role", data.role);
      
      router.push("/");
    },
    onError: (err: any) => {
      setErrorMsg(
        err.response?.data?.message || "Đăng nhập Google thất bại. Vui lòng thử lại."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm p-8 sm:p-10 border border-orange-100/50">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-stone-800 tracking-tight">Chào mừng trở lại</h1>
          <p className="text-stone-500 mt-2 text-sm">Đăng nhập để tiếp tục hành trình của bạn</p>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 text-red-500 text-sm p-4 rounded-2xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-stone-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-stone-50 border-transparent rounded-2xl text-stone-800 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                placeholder="bạn@email.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700 ml-1">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-stone-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-11 pr-4 py-3 bg-stone-50 border-transparent rounded-2xl text-stone-800 focus:bg-white focus:border-orange-300 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-full text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed font-medium mt-8 shadow-sm"
          >
            {loginMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Đăng nhập
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-stone-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-stone-500">Hoặc tiếp tục với</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  googleLoginMutation.mutate(credentialResponse.credential);
                }
              }}
              onError={() => {
                setErrorMsg("Kết nối tới Google thất bại.");
              }}
              shape="pill"
              text="signin_with"
            />
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-stone-500">
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-medium text-orange-600 hover:text-orange-700 transition-colors">
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
