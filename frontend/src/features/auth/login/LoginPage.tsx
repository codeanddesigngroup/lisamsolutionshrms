"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Grainient from "@/components/backgrounds/Grainient";
import api from "@/lib/api";
import { type LoginResponse } from "@/lib/auth-contract";
import { useAuth } from "@/context/AuthContext";
import styles from "./LoginPage.module.css";

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
  const [showPassword, setShowPassword] = useState(false);
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
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.formPane}>
          <div className={styles.formCard}>
              <Link href="/" className={styles.logoLink}>
                <Image src="/logo-black.png" alt="Logo" width={124} height={42} className={styles.logo} priority />
              </Link>

              <div>
                <h1 className={styles.heading}>Welcome Back</h1>
                <p className={styles.subtitle}>We Are Happy To See You Again</p>
              </div>

              <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                {loginError && (
                  <div className={styles.alert}>
                    {loginError}
                  </div>
                )}

                <div>
                  <div
                    className={`${styles.field} ${errors.email ? styles.fieldError : ""}`}
                  >
                    <input
                      type="email"
                      id="email"
                      placeholder="Enter your email"
                      {...register("email")}
                      className={styles.input}
                    />
                    <Mail className={styles.icon} size={16} />
                  </div>
                  {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
                </div>

                <div>
                  <div
                    className={`${styles.field} ${errors.password ? styles.fieldError : ""}`}
                  >
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Enter your password"
                      {...register("password")}
                      className={styles.input}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className={styles.iconButton}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className={styles.errorText}>{errors.password.message}</p>}
                </div>

                <div className={styles.optionsRow}>
                  <label className={styles.remember}>
                    <input type="checkbox" {...register("rememberMe")} className={styles.checkbox} />
                    Remember me
                  </label>
                  <Link href="/forgot-password" className={styles.forgot}>
                    Forgot Password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={styles.submit}
                >
                  {loading ? (
                    <>
                      <svg className={styles.spinner} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle opacity="0.25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Authenticating...
                    </>
                  ) : "Login"}
                </button>
              </form>
          </div>
        </section>

          <section className={styles.artPane} aria-hidden="true">
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
              className={styles.grainient}
            />
            <div className={styles.artOverlay} />
            <div className={styles.copyright}>
              (c) 2026 Lisam Solutions. All rights reserved.
              <br />
              Unauthorized use or reproduction of this portal is prohibited.
            </div>
          </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={styles.loadingScreen} />}>
      <LoginFormContent />
    </Suspense>
  );
}
