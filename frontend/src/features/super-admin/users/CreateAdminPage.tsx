"use client";

import { ArrowLeft, Eye, EyeOff, Save, Shield } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { emailPattern, validateAdminPassword } from "@/lib/admin-password";
import { getModulesFromPermissions, rolePermissions } from "@/lib/auth-contract";
import { createAdminAccount, fetchAdminWorkspace } from "./api";
import type { AdminAccount, AdminFormState, Company, Role } from "./types";
import { emptyAdminForm, getCompanyName, normalizePermissions } from "./utils";

const fullAdminPermissions = normalizePermissions(rolePermissions.admin);

export default function CreateAdminPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminAccount[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [form, setForm] = useState<AdminFormState>({
    ...emptyAdminForm,
    permissions: fullAdminPermissions,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchAdminWorkspace()
        .then((workspace) => {
          setUsers(workspace.admins);
          setCompanies(workspace.companies);
          setRoles(workspace.roles);
          const adminRoleIds = new Set(
            workspace.roles
              .filter((role) => role.name.trim().toLowerCase() === "admin")
              .map((role) => String(role.id)),
          );
          const assignedAdminCompanyIds = new Set(
            workspace.admins
              .filter((user) => String(user.role_id || user.role_record?.id || "") && adminRoleIds.has(String(user.role_id || user.role_record?.id)))
              .map((user) => String(user.company_id || user.company?.id || ""))
              .filter(Boolean),
          );
          const availableCompanies = workspace.companies.filter((company) => !assignedAdminCompanyIds.has(String(company.id)));
          const firstCompanyId = availableCompanies[0]?.id;
          if (firstCompanyId) {
            setForm((current) => ({
              ...current,
              company_id: String(firstCompanyId),
            }));
          }
        })
        .catch((error) => {
          console.error("Load companies failed:", error);
          showToast("Unable to load companies and roles.", "error");
        })
        .finally(() => setLoading(false));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [showToast]);

  const selectedCompanyName = useMemo(
    () => getCompanyName(companies.find((company) => String(company.id) === form.company_id)),
    [companies, form.company_id],
  );

  const adminRoleIds = useMemo(
    () =>
      new Set(
        roles
          .filter((role) => role.name.trim().toLowerCase() === "admin")
          .map((role) => String(role.id)),
      ),
    [roles],
  );

  const assignedAdminCompanyIds = useMemo(
    () =>
      new Set(
        users
          .filter((user) => String(user.role_id || user.role_record?.id || "") && adminRoleIds.has(String(user.role_id || user.role_record?.id)))
          .map((user) => String(user.company_id || user.company?.id || ""))
          .filter(Boolean),
      ),
    [adminRoleIds, users],
  );

  const availableCompanies = useMemo(
    () => companies.filter((company) => !assignedAdminCompanyIds.has(String(company.id))),
    [assignedAdminCompanyIds, companies],
  );

  const passwordValidationMessage = useMemo(
    () =>
      validateAdminPassword({
        password: form.password,
        required: true,
        name: form.name,
        email: form.email,
        companyName: selectedCompanyName,
      }),
    [form.email, form.name, form.password, selectedCompanyName],
  );

  const visiblePasswordError = passwordTouched && passwordValidationMessage;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.company_id) {
      showToast("Name, email, and company are required.", "error");
      return;
    }
    if (!emailPattern.test(form.email.trim())) {
      showToast("Enter a valid admin email address.", "error");
      return;
    }
    if (passwordValidationMessage) {
      setPasswordTouched(true);
      showToast(passwordValidationMessage, "error");
      return;
    }

    const permissions = normalizePermissions(form.permissions);
    setSaving(true);

    try {
      await createAdminAccount({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        role: "admin",
        company_id: form.company_id,
        status: form.status,
        permissions,
        modules: getModulesFromPermissions(permissions),
      });
      showToast("User created successfully.");
      router.push("/super-admin/users");
    } catch (error) {
      console.error("Create user failed:", error);
      showToast("Unable to create user.", "error");
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="row bg-title mb-2">
          <div className="col-lg-8 col-md-8 col-sm-7 col-xs-12">
            <h1 className="text-base font-black uppercase tracking-widest text-gray-800">
              <Shield className="mr-2 inline-block h-5 w-5 text-primary" />
              Add User
            </h1>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Create a user account and assign a role
            </p>
          </div>
          <div className="col-lg-4 col-md-4 col-sm-5 col-xs-12 flex justify-end">
            <Link href="/super-admin/users">
              <Button type="button" className="btn-default btn-sm">
                <ArrowLeft className="h-4 w-4" /> Back to Users
              </Button>
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate autoComplete="off" className="white-box space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Name</label>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="form-control"
                placeholder="name"
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Email</label>
              <input
                required
                type="email"
                autoComplete="new-email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="form-control"
                placeholder="email@company.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Company / Branch</label>
              <select
                required
                value={form.company_id}
                disabled={loading}
                onChange={(event) => setForm((current) => ({ ...current, company_id: event.target.value }))}
                className="form-control"
              >
                <option value="">Select company</option>
                {availableCompanies.map((company) => (
                  <option key={String(company.id)} value={String(company.id)}>
                    {getCompanyName(company)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AdminFormState["status"] }))}
                className="form-control"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="mb-2">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
              <div className="relative">
                <input
                  required
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onBlur={() => setPasswordTouched(true)}
                  onChange={(event) => {
                    setPasswordTouched(true);
                    setForm((current) => ({ ...current, password: event.target.value }));
                  }}
                  className="form-control pr-12"
                  placeholder="Set password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {visiblePasswordError ? (
                <p className="mt-1.5 text-[10px] font-bold text-red-500">{passwordValidationMessage}</p>
              ) : (
                <p className="mt-1.5 text-[10px] font-bold text-gray-400">Full permissions will be assigned.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-5">
            <Button type="submit" loading={saving} className="h-11 bg-primary px-8 text-[10px] font-black uppercase tracking-widest text-white">
              <Save className="h-4 w-4" /> Create User
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
