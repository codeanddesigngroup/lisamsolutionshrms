import { Eye, EyeOff, Mail, Shield, User } from "lucide-react";
import Card from "@/components/ui/Card";
import type { CreateCompanyAdminPayload } from "../types";

type CompanyAdminAccessFormProps = {
  admin: CreateCompanyAdminPayload["admin"];
  showPassword: boolean;
  passwordError: string | false;
  passwordMessage: string;
  onChange: (name: keyof CreateCompanyAdminPayload["admin"], value: string) => void;
  onTogglePassword: () => void;
  onPasswordTouched: () => void;
};

export const CompanyAdminAccessForm = ({
  admin,
  showPassword,
  passwordError,
  passwordMessage,
  onChange,
  onTogglePassword,
  onPasswordTouched,
}: CompanyAdminAccessFormProps) => (
  <Card title="Company Admin Access" className="border-none bg-white p-8 shadow-sm">
    <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-bold leading-relaxed text-blue-700">
      This user becomes the first admin for this company or branch. Admin users can manage records based on permissions assigned by Super Admin.
    </div>

    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Name</label>
        <div className="relative">
          <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            required
            autoComplete="off"
            value={admin.name}
            onChange={(event) => onChange("name", event.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Admin Email</label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            required
            type="email"
            autoComplete="new-email"
            value={admin.email}
            onChange={(event) => onChange("email", event.target.value)}
            className="w-full rounded-xl border border-gray-100 bg-gray-50 py-3 pl-11 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/10"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
        <div className="relative">
          <Shield className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            required
            minLength={8}
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={admin.password}
            onBlur={onPasswordTouched}
            onChange={(event) => {
              onPasswordTouched();
              onChange("password", event.target.value);
            }}
            className={`w-full rounded-xl border bg-gray-50 py-3 pl-11 pr-12 text-xs font-bold outline-none focus:ring-2 ${
              passwordError ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-100 focus:ring-primary/10"
            }`}
          />
          <button
            type="button"
            onClick={onTogglePassword}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        {passwordError ? (
          <p className="mt-1.5 text-[10px] font-bold text-red-500">{passwordMessage}</p>
        ) : (
          <p className="mt-1.5 text-[10px] font-bold text-gray-400">Required. Use a unique password with 8 or more characters.</p>
        )}
      </div>
    </div>
  </Card>
);
