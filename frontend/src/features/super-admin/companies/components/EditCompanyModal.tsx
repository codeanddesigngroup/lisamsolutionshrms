import { Save } from "lucide-react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { Company, CompanyFormState } from "../types";

type EditCompanyModalProps = {
  company: Company | null;
  form: CompanyFormState;
  setForm: Dispatch<SetStateAction<CompanyFormState>>;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export const EditCompanyModal = ({ company, form, setForm, onClose, onSubmit }: EditCompanyModalProps) => (
  <Modal isOpen={!!company} onClose={onClose} title="Edit Company" size="md">
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Company / Branch Name</label>
          <input
            required
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold"
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status</label>
          <select
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
            className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-bold"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 border-t border-gray-100 pt-5">
        <Button type="button" onClick={onClose} className="btn-default flex-1">Cancel</Button>
        <Button type="submit" className="btn-success flex-1">
          <Save className="mr-2 h-4 w-4" /> Save Company
        </Button>
      </div>
    </form>
  </Modal>
);
