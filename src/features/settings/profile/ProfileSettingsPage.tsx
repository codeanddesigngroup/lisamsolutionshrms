"use client";

import SettingsLayout from "@/components/layout/SettingsLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { User, Mail, Phone, Lock, Camera, Save, Globe } from "lucide-react";
import { useState } from "react";

export default function ProfileSettingsPage() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
           <div>
              <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">My Profile</h1>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Manage your personal account settings and password</p>
           </div>
           <Button className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
              <Save className="h-4 w-4 mr-2" /> Save Profile
           </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <Card title="Account Information" className="border-none shadow-sm">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                       <input type="text" defaultValue="Admin User" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                       <input type="email" defaultValue="admin@company.com" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                       <input type="text" defaultValue="+1 234 567 890" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Timezone</label>
                       <select className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer">
                          <option>UTC +00:00 (London)</option>
                          <option>UTC +05:30 (India)</option>
                          <option>UTC -05:00 (New York)</option>
                       </select>
                    </div>
                 </div>
              </Card>

              <Card title="Security" className="border-none shadow-sm">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
                       <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm Password</label>
                       <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
                    </div>
                 </div>
                 <div className="mt-4 flex items-center space-x-2 text-[10px] text-gray-400 font-bold bg-blue-50/50 p-3 rounded-xl border border-blue-50">
                    <Lock className="h-3.5 w-3.5 text-blue-500" />
                    <span>Leaving password fields blank will keep your current password.</span>
                 </div>
              </Card>
           </div>

           <div className="space-y-6">
              <Card title="Profile Photo" className="border-none shadow-sm text-center">
                 <div className="relative inline-block mt-4">
                    <div className="h-32 w-32 rounded-3xl bg-gray-50 flex items-center justify-center text-gray-300 shadow-inner border border-gray-100 overflow-hidden">
                       <User className="h-16 w-16" />
                    </div>
                    <button className="absolute -bottom-2 -right-2 h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-110 transition-transform">
                       <Camera className="h-5 w-5" />
                    </button>
                 </div>
                 <p className="mt-6 text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
                    Allowed JPG, GIF or PNG.<br />Max size of 2MB
                 </p>
              </Card>

              <Card title="Social Links" className="border-none shadow-sm">
                 <div className="space-y-4 pt-2">
                    <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-xl">
                       <Globe className="h-4 w-4 text-gray-400" />
                       <input type="text" placeholder="https://twitter.com/..." className="bg-transparent border-none text-[11px] font-bold outline-none flex-1" />
                    </div>
                    <div className="flex items-center space-x-3 bg-gray-50 p-2 rounded-xl">
                       <Globe className="h-4 w-4 text-gray-400" />
                       <input type="text" placeholder="https://linkedin.com/in/..." className="bg-transparent border-none text-[11px] font-bold outline-none flex-1" />
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
