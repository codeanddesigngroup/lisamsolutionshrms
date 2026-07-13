"use client";

import { type FormEvent, useState } from "react";
import { Eye, EyeOff, Lock, Mail, Save, Shield, User, UserCog } from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function SuperAdminProfilePage() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "Super Admin",
    email: user?.email || "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      showToast("Name and email are required", "error");
      return;
    }

    if (form.password && form.password !== form.confirmPassword) {
      showToast("Password confirmation does not match", "error");
      return;
    }

    setSaving(true);
    updateUser({
      name: form.name.trim(),
      email: form.email.trim(),
    });
    setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
    showToast("Super admin profile updated", "success");
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="white-box flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h4 className="m-0 font-black uppercase tracking-tight text-gray-800">Super Admin Profile</h4>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Platform owner account and security details
              </p>
            </div>
          </div>

          <span className="label label-success">Platform Access</span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-1">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <UserCog className="h-12 w-12" />
              </div>
              <h3 className="mt-5 text-lg font-black uppercase tracking-widest text-gray-800">{form.name || "Super Admin"}</h3>
              <p className="mt-1 text-xs font-bold text-gray-400">{form.email || "No email set"}</p>
              <div className="mt-5 grid w-full grid-cols-2 gap-3">
                <div className="rounded border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Role</p>
                  <p className="mt-1 text-xs font-black text-gray-800">Super Admin</p>
                </div>
                <div className="rounded border border-gray-100 bg-gray-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scope</p>
                  <p className="mt-1 text-xs font-black text-gray-800">Platform</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h5 className="m-0 text-[11px] font-black uppercase tracking-widest text-gray-700">Account Information</h5>
                <p className="mt-1 text-xs font-bold text-gray-400">Update the name and email shown across the platform panel.</p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Name</span>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                    <input
                      className="form-control pl-11"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Email</span>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                    <input
                      className="form-control pl-11"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      required
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">New Password</span>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                    <input
                      className="form-control pl-11 pr-11"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                      placeholder="Leave blank to keep current"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-gray-500">Confirm Password</span>
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(event) => setForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    placeholder="Repeat new password"
                  />
                </label>
              </div>

              <div className="flex justify-end border-t border-gray-100 pt-5">
                <Button type="submit" loading={saving} className="bg-primary px-8 text-white">
                  <Save className="h-4 w-4" />
                  Save Profile
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
