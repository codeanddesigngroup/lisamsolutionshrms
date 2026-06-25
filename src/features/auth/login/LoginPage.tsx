"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Apple, Eye, Mail, } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Grainient from "@/components/backgrounds/Grainient";
import api from "@/lib/api";
import { type LoginResponse } from "@/lib/auth-contract";
import { useAuth } from "@/context/AuthContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const redirectTo = searchParams.get("next") || undefined;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setLoginError("");
    try {
      const response = await api.post<{ data: LoginResponse }>("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const { token, user } = response.data.data;
      login(token, user, data.rememberMe, redirectTo);
    } catch (err: any) {
      console.warn("Login failed:", err);
      setLoginError(err?.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#078bff] text-slate-950">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16),rgba(255,255,255,0.04)_45%,rgba(0,69,185,0.12))]"
      />

      <div className="relative z-10 h-screen w-screen overflow-hidden">
        <div className="grid h-screen w-screen overflow-hidden bg-white/18 lg:grid-cols-[0.48fr_0.52fr]">
          <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(242,248,255,0.92))] px-6 py-10 backdrop-blur-2xl sm:px-10 lg:px-12">
            <div className="w-full max-w-[325px]">
              <Link href="/" className="mb-7 flex items-center gap-3">
                <Image src="/logo-black.png" alt="Logo" width={124} height={42} className="max-h-10 w-auto object-contain" />
              </Link>

              <div className="mb-5">
                <h1 className="m-0 text-[19px] font-semibold normal-case leading-tight tracking-normal text-slate-950">Welcome Back</h1>
                <p className="mt-1 text-[11px] font-medium text-slate-400">We Are Happy To See You Again</p>
              </div>

              {/* <div className="mb-5 grid h-[30px] grid-cols-2 rounded-full p-[2px] shadow-inner"> */}
                {/* <span className="flex items-center justify-center rounded-full bg-[#418af2] text-[10px] font-bold text-white shadow-[0_6px_14px_rgba(65,138,242,0.32)]">
                  Sign in
                </span> */}
                {/* <Link href="/signup" className="flex items-center justify-center rounded-full text-[10px] font-bold text-slate-500 transition hover:text-slate-950">
                  Sign Up
                </Link> */}
              {/* </div> */}

              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                {loginError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[10px] font-bold text-red-600">
                    {loginError}
                  </div>
                )}

                <div>
                  <div
                    className={`login-glass-field flex items-center rounded-full border px-3 transition ${errors.email ? "border-red-400/80" : "border-slate-200"}`}
                  >
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter your email"
                      {...register("email")}
                      className="login-glass-input text-[11px] font-medium"
                    />
                    <Mail className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  </div>
                  {errors.email && <p className="mt-1.5 text-[9px] font-bold uppercase tracking-widest text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <div
                    className={`login-glass-field flex items-center rounded-full border px-3 transition ${errors.password ? "border-red-400/80" : "border-slate-200"}`}
                  >
                    <input
                      type="password"
                      id="password"
                      placeholder="Enter your password"
                      {...register("password")}
                      className="login-glass-input text-[11px] font-medium"
                    />
                    <Eye className="ml-2 h-3.5 w-3.5 shrink-0 text-slate-500" />
                  </div>
                  {errors.password && <p className="mt-1.5 text-[9px] font-bold uppercase tracking-widest text-red-600">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex cursor-pointer items-center gap-2 text-[10px] font-semibold text-slate-500">
                    <input type="checkbox" {...register("rememberMe")} className="login-glass-checkbox" />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className="text-[10px] font-semibold text-[#226ed8] transition hover:text-[#0f55b8]">
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`mt-8 h-11 w-full rounded-full bg-[#418af2] text-[12px] font-semibold text-white shadow-[0_16px_30px_rgba(65,138,242,0.32)] transition ${loading ? "cursor-not-allowed opacity-70" : "hover:bg-[#2f7eea] active:scale-[0.98]"}`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="-ml-1 mr-3 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </span>
                  ) : "Login"}
                </button>

                {/* <div className="flex items-center gap-4 pt-6">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Or</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div> */}

                {/* <button type="button" className="flex h-9 w-full items-center justify-center gap-2 rounded-full bg-slate-950 text-[12px] font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.2)] transition hover:bg-slate-800">
                  <Apple className="h-4 w-4" />
                  Log in with Apple
                </button>

                <button type="button" className="flex h-9 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/75 text-[12px] font-semibold text-slate-600 transition hover:bg-white">
                  <span className="text-sm font-black text-[#4285f4]">G</span>
                  Log in with Google
                </button> */}
              </form>
            </div>
          </div>

          <div className="relative hidden min-h-screen overflow-hidden bg-[#031d4c] lg:block">
            <Grainient
              color1="#a9d2ff"
              color2="#1b73ff"
              color3="#001d56"
              timeSpeed={0.2}
              colorBalance={-0.08}
              warpStrength={1.35}
              warpFrequency={5.8}
              warpSpeed={1.7}
              warpAmplitude={35}
              blendAngle={-18}
              blendSoftness={0.04}
              rotationAmount={620}
              noiseScale={2.2}
              grainAmount={0.06}
              grainScale={1.8}
              contrast={1.65}
              saturation={1.35}
              zoom={0.72}
              className="absolute inset-0 h-full w-full"
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_45%_35%,rgba(255,255,255,0.12),transparent_36%),linear-gradient(180deg,rgba(0,12,44,0.05),rgba(0,12,44,0.38))]" />
            <div className="absolute bottom-8 left-1/2 w-[76%] -translate-x-1/2 rounded-[18px] border border-white/30 bg-white/16 px-8 py-4 text-center text-[9px] leading-relaxed text-white/72 shadow-[0_16px_45px_rgba(0,0,0,0.24)] backdrop-blur-xl">
              (c) 2026 Lisam Solutions. All rights reserved.
              <br />
              Unauthorized use or reproduction of this portal is prohibited.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <LoginFormContent />
    </Suspense>
  );
}
