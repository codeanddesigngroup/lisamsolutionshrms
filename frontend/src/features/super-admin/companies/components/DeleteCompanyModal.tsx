import { AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

type DeleteCompanyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export const DeleteCompanyModal = ({ isOpen, onClose, onConfirm }: DeleteCompanyModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Delete Company" size="sm">
    <div className="px-4 py-6 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded bg-red-50 text-red-500">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <p className="mb-8 text-xs font-bold leading-relaxed text-gray-500">
        This removes the company or branch from the frontend mock store and matches the future PHP delete flow.
      </p>
      <div className="flex gap-3">
        <Button onClick={onClose} className="btn-default flex-1">Cancel</Button>
        <Button onClick={onConfirm} className="btn-danger flex-1">Delete</Button>
      </div>
    </div>
  </Modal>
);
