"use client";

import SettingsLayout from "@/components/layout/SettingsLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Bell, Mail, MessageSquare, Smartphone, Save } from "lucide-react";
import { useState } from "react";

const initialSettings = [
  { id: 1, title: "New Project Assigned", email: true, push: true, slack: false },
  { id: 2, title: "New Task Assigned", email: true, push: true, slack: true },
  { id: 3, title: "Task Completed", email: false, push: true, slack: false },
  { id: 4, title: "New Invoice Generated", email: true, push: false, slack: false },
  { id: 5, title: "Payment Received", email: true, push: true, slack: true },
  { id: 6, title: "Leave Request Submitted", email: true, push: true, slack: false },
];

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState(initialSettings);

  const toggle = (id: number, field: 'email' | 'push' | 'slack') => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, [field]: !s[field] } : s));
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between">
           <div>
              <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Notification Settings</h1>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">Control which notifications you receive across different channels</p>
           </div>
           <Button className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
              <Save className="h-4 w-4 mr-2" /> Save Settings
           </Button>
        </div>

        <Card title="Email & Push Notifications" className="border-none shadow-sm overflow-hidden">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-gray-50/50 border-b border-gray-50">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Notification Event</th>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Email</th>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Push</th>
                       <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Slack</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {settings.map((item) => (
                       <tr key={item.id} className="hover:bg-gray-50/20 transition-colors">
                          <td className="px-6 py-4">
                             <p className="text-xs font-bold text-gray-700">{item.title}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <input 
                                type="checkbox" 
                                checked={item.email} 
                                onChange={() => toggle(item.id, 'email')}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                             />
                          </td>
                          <td className="px-6 py-4 text-center">
                             <input 
                                type="checkbox" 
                                checked={item.push} 
                                onChange={() => toggle(item.id, 'push')}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                             />
                          </td>
                          <td className="px-6 py-4 text-center">
                             <input 
                                type="checkbox" 
                                checked={item.slack} 
                                onChange={() => toggle(item.id, 'slack')}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                             />
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <Card title="Slack Integration" className="border-none shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                       <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-gray-700">Slack Webhook</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Connect your workspace</p>
                    </div>
                 </div>
                 <span className="bg-gray-100 text-gray-400 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Disconnected</span>
              </div>
              <input type="text" placeholder="https://hooks.slack.com/services/..." className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
           </Card>

           <Card title="Pusher Settings" className="border-none shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                       <Smartphone className="h-5 w-5" />
                    </div>
                    <div>
                       <p className="text-xs font-bold text-gray-700">Real-time Notifications</p>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pusher.com Credentials</p>
                    </div>
                 </div>
                 <span className="bg-green-100 text-green-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Active</span>
              </div>
              <div className="space-y-4">
                 <input type="text" placeholder="Pusher App ID" className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" />
              </div>
           </Card>
        </div>
      </div>
    </SettingsLayout>
  );
}
