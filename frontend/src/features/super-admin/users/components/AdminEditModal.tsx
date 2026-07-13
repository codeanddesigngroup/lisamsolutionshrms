import { Eye, EyeOff, Save } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { AdminFormState } from "../types";

type AdminEditModalProps = {
  isOpen: boolean;
  saving: boolean;
  form: AdminFormState;
  selectedCompanyName: string;
  showPassword: boolean;
  visiblePasswordError: string | false;
  passwordValidationMessage: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  setForm: Dispatch<SetStateAction<AdminFormState>>;
  setShowPassword: Dispatch<SetStateAction<boolean>>;
  setPasswordTouched: Dispatch<SetStateAction<boolean>>;
};

export const AdminEditModal = ({
  isOpen,
  saving,
  form,
  selectedCompanyName,
  showPassword,
  visiblePasswordError,
  passwordValidationMessage,
  onClose,
  onSubmit,
  setForm,
  setShowPassword,
  setPasswordTouched,
}: AdminEditModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Edit Admin" size="xl">
    <form onSubmit={onSubmit} noValidate autoComplete="off" className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Name</label>
          <input
            required
            autoComplete="off"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
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
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Company / Branch</label>
          <input
            readOnly
            value={form.company_id ? selectedCompanyName : "Unassigned"}
            className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold text-gray-500 outline-none"
          />
        </div>
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Status</label>
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AdminFormState["status"] }))}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-bold text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-gray-400">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onBlur={() => setPasswordTouched(true)}
              onChange={(event) => {
                setPasswordTouched(true);
                setForm((current) => ({ ...current, password: event.target.value }));
              }}
              className={`w-full rounded-xl border bg-white py-3 pl-4 pr-12 text-xs font-bold text-gray-700 outline-none transition focus:ring-2 ${
                visiblePasswordError
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-200 focus:border-primary focus:ring-primary/10"
              }`}
              placeholder="Saved admin password"
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
            <p className="mt-1.5 text-[10px] font-bold text-gray-400">
              Saved password is loaded here. Use the eye button to view it or type a new one.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-5">
        <Button type="button" onClick={onClose} className="h-10 border-none bg-gray-100 px-5 text-gray-600">
          Cancel
        </Button>
        <Button type="submit" loading={saving} className="h-10 bg-primary px-6 text-[10px] font-black uppercase tracking-widest text-white">
          <Save className="h-4 w-4" />
          Save Admin
        </Button>
      </div>
    </form>
  </Modal>
);
