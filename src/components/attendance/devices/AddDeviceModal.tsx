"use client";

import { useState } from "react";
import { X, Cpu, Network, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { devicesService } from "@/services/attendance/devices.service";
import { useToast } from "@/context/ToastContext";

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddDeviceModal({ isOpen, onClose, onSuccess }: AddDeviceModalProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    serial_number: "",
    ip_address: "",
    port: "4370",
    protocol: "ADMS",
    location: "",
    device_password: ""
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In mock mode, this just triggers a success
      await devicesService.listDevices(); // Simulate API call
      showToast("Device registered successfully", "success");
      onSuccess();
      onClose();
    } catch (error) {
      showToast("Failed to register device", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black uppercase tracking-tight text-gray-800">New Device Wizard</h4>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Step {step} of 2</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-50 rounded-full">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Cpu className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Basic Hardware Info</span>
                </div>
                <div className="form-group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Device Friendly Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Main Entrance MB460"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Serial Number</label>
                  <input 
                    type="text" 
                    className="form-control font-mono" 
                    placeholder="ZK-XXXXX-XXXX"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Physical Location</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="e.g. Floor 2 / Lobby"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Network className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Network & Protocol</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">IP Address</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="192.168.1.XX"
                      value={formData.ip_address}
                      onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Port</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={formData.port}
                      onChange={(e) => setFormData({...formData, port: e.target.value})}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Communication Protocol</label>
                  <select 
                    className="form-control"
                    value={formData.protocol}
                    onChange={(e) => setFormData({...formData, protocol: e.target.value})}
                  >
                    <option value="ADMS">ADMS (Cloud Push)</option>
                    <option value="P2P">P2P (Direct Socket)</option>
                    <option value="USB">USB Import</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Device Password (Comm Key)</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                    <input 
                      type="password" 
                      className="form-control pl-10" 
                      placeholder="Default is 0"
                      value={formData.device_password}
                      onChange={(e) => setFormData({...formData, device_password: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50 flex items-center justify-between">
            <button 
              type="button"
              onClick={() => step === 2 ? setStep(1) : onClose()}
              className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
            >
              {step === 2 ? "Back" : "Cancel"}
            </button>
            <Button 
              type={step === 2 ? "submit" : "button"}
              variant="primary"
              onClick={() => step === 1 ? setStep(2) : null}
              disabled={loading}
              className="h-11 px-8 rounded-xl shadow-lg shadow-primary/20"
            >
              {loading ? "Registering..." : step === 1 ? "Next Step" : "Complete Onboarding"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
