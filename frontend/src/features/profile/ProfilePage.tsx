"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { 
  User, 
  Image as ImageIcon,
  Save,
  Eye,
  EyeOff,
  Calendar,
  Fingerprint
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useToast } from "@/context/ToastContext";
import AttendanceIdentityCard from "@/components/attendance/employee/AttendanceIdentityCard";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { showToast } = useToast();
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "User",
    email: user?.email || "",
    password: "",
    address: "",
    emailNotifications: "1",
    image: null as string | null
  });

  const [calendarPerms, setCalendarPerms] = useState({
    leads: false,
    leaves: false,
    invoices: false,
    contracts: false,
    events: false,
    tasks: false,
    holidays: false
  });

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      updateUser({
        name: profile.name,
        email: profile.email,
      });
      showToast("Profile updated successfully", "success");
    } catch (err) {
      console.error("Profile update error:", err);
      showToast("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="row bg-title mb-6">
            <div className="col-lg-12">
                <h4 className="page-title m-0">
                    <User className="h-5 w-5 mr-2 inline-block text-primary" /> 
                    My Profile
                </h4>
            </div>
        </div>

        <div className="panel panel-inverse white-box">
            <div className="panel-heading border-b border-[#f2f2f3] pb-4 mb-6 font-bold uppercase text-[12px] tracking-wider text-gray-500">
                Update Profile Info
            </div>

            <form onSubmit={handleUpdate} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="form-group">
                        <label className="required block text-[11px] font-bold text-gray-400 uppercase mb-2">Your Name</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            value={profile.name}
                            onChange={(e) => setProfile({...profile, name: e.target.value})}
                            required 
                        />
                    </div>
                    <div className="form-group">
                        <label className="required block text-[11px] font-bold text-gray-400 uppercase mb-2">Your Email</label>
                        <input 
                            type="email" 
                            className="form-control" 
                            value={profile.email}
                            onChange={(e) => setProfile({...profile, email: e.target.value})}
                            required 
                        />
                    </div>
                    <div className="form-group relative">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Your Password</label>
                        <div className="relative">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="form-control pr-10" 
                                value={profile.password}
                                onChange={(e) => setProfile({...profile, password: e.target.value})}
                                placeholder="Leave blank to keep current"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2 text-gray-400"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 block italic font-medium">Leave blank if you do not want to change password.</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Your Address</label>
                        <textarea 
                            className="form-control min-h-[100px] py-2"
                            value={profile.address}
                            onChange={(e) => setProfile({...profile, address: e.target.value})}
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label className="block text-[11px] font-bold text-gray-400 uppercase mb-4">Email Notifications</label>
                        <div className="flex space-x-6">
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="notif" 
                                    value="1" 
                                    checked={profile.emailNotifications === "1"}
                                    onChange={(e) => setProfile({...profile, emailNotifications: e.target.value})}
                                    className="mr-2" 
                                />
                                <span className="text-[12px] font-bold uppercase text-gray-600">Enable</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="notif" 
                                    value="0" 
                                    checked={profile.emailNotifications === "0"}
                                    onChange={(e) => setProfile({...profile, emailNotifications: e.target.value})}
                                    className="mr-2" 
                                />
                                <span className="text-[12px] font-bold uppercase text-gray-600">Disable</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="form-group border-t border-[#f2f2f3] pt-8">
                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-4">Profile Picture</label>
                    <div className="flex items-start space-x-6">
                        <div className="h-40 w-56 border border-[#e4e7ea] rounded bg-gray-50 flex items-center justify-center overflow-hidden">
                            {profile.image ? (
                                <Image src={profile.image} alt="Profile" width={224} height={160} unoptimized className="h-full w-full object-cover" />
                            ) : (
                                <ImageIcon className="h-12 w-12 text-gray-200" />
                            )}
                        </div>
                        <div className="space-y-3">
                            <Button type="button" className="btn-info btn-sm w-full">Select Image</Button>
                            <p className="text-[10px] text-gray-400 max-w-[200px]">Supported formats: JPG, PNG, GIF. Max size 2MB.</p>
                        </div>
                    </div>
                </div>

                <div className="border-t border-[#f2f2f3] pt-8">
                    <h4 className="box-title text-sm font-bold uppercase mb-4 flex items-center">
                        <Fingerprint className="h-4 w-4 mr-2 text-primary" /> Workforce Identity
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <AttendanceIdentityCard 
                          biometricId="1002" 
                          status="active" 
                          lastScan="Today, 09:05 AM"
                          assignedDevices={["Main Gate (MB460)", "Production Floor"]}
                        />
                        <div className="white-box p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Security Note</p>
                            <p className="text-[11px] font-bold text-gray-500">Your biometric ID is used for hardware recognition. Contact HR to update your fingerprint or face data.</p>
                        </div>
                    </div>
                </div>

                {/* Google Calendar Section (Legacy Parity) */}
                <div className="border-t border-[#f2f2f3] pt-8">
                    <h4 className="box-title text-sm font-bold uppercase mb-4 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" /> Google Calendar Module
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {Object.keys(calendarPerms).map((key) => (
                            <label key={key} className="flex items-center space-x-2 cursor-pointer bg-gray-50 p-2 rounded border border-transparent hover:border-primary transition-all">
                                <input 
                                    type="checkbox" 
                                    className="h-4 w-4 rounded"
                                    checked={calendarPerms[key as keyof typeof calendarPerms]}
                                    onChange={(e) => setCalendarPerms({...calendarPerms, [key]: e.target.checked})}
                                />
                                <span className="text-[10px] font-bold uppercase text-gray-600">{key}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-actions border-t border-[#f2f2f3] pt-8 flex justify-end">
                    <Button type="submit" className="btn-success h-10 px-8 text-sm" disabled={loading}>
                        <Save className="h-4 w-4 mr-2" /> {loading ? 'Updating...' : 'Update Profile'}
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
