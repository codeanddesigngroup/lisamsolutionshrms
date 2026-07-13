import DashboardLayout from "@/components/layout/DashboardLayout";
import SettingsLayout from "@/components/layout/SettingsLayout";
import Link from "next/link";
import { Save, Upload } from "lucide-react";

export default function AccountSettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Page Title Bar */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-0 gap-3">
          <h1 className="text-base font-semibold text-gray-700">Account Settings</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ol className="flex text-sm text-gray-500 space-x-1">
              <li><Link href="/dashboard" className="hover:text-primary">Home</Link></li>
              <li>/</li>
              <li className="text-gray-700">Account Settings</li>
            </ol>
          </div>
        </div>

        <SettingsLayout>
          <div className="p-6">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-4 mb-6 uppercase tracking-wider">Update Settings</h2>
            
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Company Name <span className="text-red-500">*</span></label>
                  <input type="text" defaultValue="Lisam Solutions" className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Company Email <span className="text-red-500">*</span></label>
                  <input type="email" defaultValue="admin@lisam.com" className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Company Phone</label>
                  <input type="tel" defaultValue="+1 234 567 890" className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Company Logo</label>
                  <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="h-20 w-32 bg-white rounded shadow-sm mb-4 flex items-center justify-center overflow-hidden">
                      <img src="/logo-placeholder.png" alt="Logo" className="max-h-full" />
                    </div>
                    <button type="button" className="flex items-center space-x-1 text-xs font-bold text-primary">
                      <Upload className="h-3 w-3" /><span>Select Image</span>
                    </button>
                  </div>
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Company Website</label>
                  <input type="text" defaultValue="https://lisamsolutions.com" className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Company Address</label>
                  <textarea rows={5} className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary" defaultValue="123 Street Name, City, Country"></textarea>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Default Currency</label>
                  <select className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option>$ (USD)</option>
                    <option>€ (EUR)</option>
                    <option>£ (GBP)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Default Timezone</label>
                  <select className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option>UTC</option>
                    <option>Asia/Kolkata</option>
                    <option>America/New_York</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Date Format</label>
                  <select className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option>d-m-Y</option>
                    <option>m-d-Y</option>
                    <option>Y-m-d</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Time Format</label>
                  <select className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option>12 Hour (h:i A)</option>
                    <option>24 Hour (H:i)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Week Start From</label>
                  <select className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option>Monday</option>
                    <option>Sunday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Language</label>
                  <select className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option>English</option>
                    <option>French</option>
                    <option>Spanish</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Dashboard Clock</label>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                      <input type="checkbox" name="toggle" id="toggle" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                      <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">Show clock on dashboard</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button type="submit" className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-8 rounded shadow-lg transition-all active:scale-95">
                  <Save className="h-4 w-4" />
                  <span>Update</span>
                </button>
              </div>
            </form>
          </div>
        </SettingsLayout>
      </div>
    </DashboardLayout>
  );
}
