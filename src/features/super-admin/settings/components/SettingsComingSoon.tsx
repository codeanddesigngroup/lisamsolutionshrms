import { Settings } from "lucide-react";

type SettingsComingSoonProps = {
  label: string;
};

export const SettingsComingSoon = ({ label }: SettingsComingSoonProps) => (
  <div className="py-20 text-center text-gray-400">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
      <Settings className="h-8 w-8 text-gray-200" />
    </div>
    <p className="text-[11px] font-bold uppercase tracking-widest">Configuration for {label} coming soon.</p>
  </div>
);
