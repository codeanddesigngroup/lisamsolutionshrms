import { CheckCircle2 } from "lucide-react";

const packageNotes = [
  "The first package created will be the default package for new registrations unless configured otherwise.",
  "Default packages cannot be deleted to ensure system stability.",
  "Changing a package price will only affect new subscriptions.",
];

export const PackagesNote = () => (
  <div className="white-box border-none bg-[#eef6fe]">
    <h5 className="mb-3 flex items-center font-bold uppercase text-[#3594fa]">
      <CheckCircle2 className="mr-2 h-4 w-4" /> Note:
    </h5>
    <div className="space-y-1 text-[11px] font-medium text-gray-500">
      {packageNotes.map((note) => (
        <p key={note}>{note}</p>
      ))}
    </div>
  </div>
);
