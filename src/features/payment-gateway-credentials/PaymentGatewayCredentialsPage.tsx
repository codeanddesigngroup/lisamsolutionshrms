"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, CreditCard, ShieldCheck, Globe, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PaymentGatewaySettingsPage() {
  const [activeTab, setActiveTab] = useState("paypal");

  const gateways = [
    { id: "paypal", name: "PayPal", icon: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
    { id: "stripe", name: "Stripe", icon: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" },
    { id: "razorpay", name: "Razorpay", icon: "https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg" },
    { id: "paystack", name: "Paystack", icon: "https://paystack.com/assets/img/v3/logo/paystack-logo-vector.png" },
    { id: "mollie", name: "Mollie", icon: "https://www.mollie.com/icons/mollie-logo.svg" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700">Payment Gateway Credentials</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/settings" className="hover:text-primary transition-colors font-bold">Settings</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold">Payment Credentials</span>
            </div>
          </div>
          <Link href="/settings">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] h-8 px-3 hover:bg-gray-200">
              <ArrowLeft className="h-3 w-3 mr-1" />
              <span>Back to Settings</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Gateways Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Gateways</h3>
              </div>
              <div className="p-2 space-y-1">
                {gateways.map((gateway) => (
                  <button
                    key={gateway.id}
                    onClick={() => setActiveTab(gateway.id)}
                    className={`w-full text-left px-4 py-3 rounded text-sm font-bold transition-colors flex items-center space-x-3 group ${
                      activeTab === gateway.id
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`h-6 w-6 bg-white rounded p-1 flex items-center justify-center ${activeTab === gateway.id ? "opacity-100" : "opacity-60"}`}>
                       <img src={gateway.icon} alt={gateway.name} className="h-full w-full object-contain" />
                    </div>
                    <span>{gateway.name}</span>
                  </button>
                ))}
              </div>
            </Card>
            
            <Card className="p-4 border-blue-100 bg-blue-50/50 shadow-sm border border-blue-200">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-blue-800 mb-1">Webhooks</h4>
                  <p className="text-[10px] text-blue-700 leading-relaxed">Ensure you configure the correct webhook URL in your gateway dashboard to receive payment confirmations automatically.</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Configuration Form */}
          <div className="lg:col-span-3">
            <Card className="p-0 border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-800 tracking-wide flex items-center">
                    <CreditCard className="h-4 w-4 mr-2 text-primary" /> 
                    {gateways.find(g => g.id === activeTab)?.name} Configuration
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Configure your {gateways.find(g => g.id === activeTab)?.name} API credentials.</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <Button className="bg-primary text-white text-[10px] font-bold px-6 h-9 uppercase tracking-widest shadow-sm shadow-primary/20">
                    <Save className="h-3.5 w-3.5 mr-2" /> Save Config
                  </Button>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="h-16 w-16 bg-gray-50 rounded-lg border border-gray-100 p-3 flex items-center justify-center">
                     <img src={gateways.find(g => g.id === activeTab)?.icon} alt="Logo" className="max-h-full max-w-full" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{gateways.find(g => g.id === activeTab)?.name} Integration</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Securely connect your account to process payments.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mode</label>
                    <div className="flex items-center space-x-6 pt-1">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="mode" className="text-primary focus:ring-primary h-3.5 w-3.5" defaultChecked />
                        <span className="text-xs font-bold text-gray-700">Sandbox / Test</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="radio" name="mode" className="text-primary focus:ring-primary h-3.5 w-3.5" />
                        <span className="text-xs font-bold text-gray-700">Live / Production</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">API Client ID <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input type="text" placeholder="Enter Client ID" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">API Secret Key <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input type="password" placeholder="••••••••••••••••" className="w-full border-gray-200 rounded p-2.5 pl-9 text-xs focus:ring-1 focus:ring-primary/20 outline-none transition-all" required />
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2 pt-4">
                    <div className="p-4 bg-gray-50 rounded border border-gray-100">
                       <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                         <Globe className="h-3 w-3 mr-1.5" /> Webhook URL
                       </h5>
                       <div className="flex items-center justify-between">
                         <code className="text-[11px] text-primary font-bold">https://yourdomain.com/api/v1/payments/{activeTab}/webhook</code>
                         <button className="text-[10px] font-bold text-gray-500 hover:text-primary uppercase tracking-wider">Copy URL</button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
