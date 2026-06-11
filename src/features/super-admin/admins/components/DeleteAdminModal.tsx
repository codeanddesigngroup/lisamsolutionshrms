import { AlertTriangle, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import type { AdminAccount } from "../types";

type DeleteAdminModalProps = {
  admin: AdminAccount | null;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteAdminModal = ({ admin, onClose, onConfirm }: DeleteAdminModalProps) => (
  <Modal isOpen={!!admin} onClose={onClose} title="Delete Admin" size="sm">
    <div className="text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-red-500">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <p className="text-sm font-black text-gray-800">{admin?.name}</p>
      <p className="mt-2 text-xs font-bold leading-5 text-gray-500">{admin?.email}</p>
      <div className="mt-6 flex gap-3">
        <Button type="button" onClick={onClose} className="h-10 flex-1 border-none bg-gray-100 text-gray-600">
          Cancel
        </Button>
        <Button type="button" onClick={onConfirm} className="h-10 flex-1 border-none bg-red-500 text-white">
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  </Modal>
);
