"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Save, User, Building, Mail, Phone, Globe, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/context/ToastContext";
import { getStoredUser } from "@/lib/session";

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  company_name: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  mobile: z.string().optional(),
  address: z.string().optional(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function CreateClientPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      company_name: "",
      website: "",
      mobile: "",
      address: "",
    },
  });

  const onSubmit = async (data: ClientFormValues) => {
    setSaving(true);
    try {
      const companyId = getStoredUser()?.company_id;
      const payload = {
        name: data.name,
        email: data.email,
        ...(companyId ? { company_id: companyId } : {}),
        client_detail: {
          company_name: data.company_name,
          website: data.website,
          mobile: data.mobile,
          address: data.address,
        }
      };

      await api.post("/client", payload);
      showToast("Client created successfully!");
      router.push("/clients");
      router.refresh();
    } catch (err) {
      console.error("Create Client Error:", err);
      showToast(getApiErrorMessage(err, "Failed to create client."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">Add New Client</h1>
            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Home</Link>
              <span className="font-bold">/</span>
              <Link href="/clients" className="hover:text-primary transition-colors font-bold uppercase tracking-tighter">Clients</Link>
              <span className="font-bold">/</span>
              <span className="text-gray-700 font-bold uppercase tracking-tighter">Add Client</span>
            </div>
          </div>
          <Link href="/clients">
            <Button className="bg-gray-100 text-gray-600 border-none text-[10px] h-8 px-4 font-black uppercase tracking-widest hover:bg-gray-200">
              <ArrowLeft className="h-3 w-3 mr-2" />
              <span>Back</span>
            </Button>
          </Link>
        </div>

        <Card className="p-8 max-w-4xl mx-auto shadow-sm border-gray-100">
          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-2">Client Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input 
                    {...register("name")}
                    type="text" 
                    placeholder="e.g. John Doe" 
                    className={`w-full border rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all ${
                      errors.name ? "border-red-500" : "border-gray-200"
                    }`} 
                  />
                  {errors.name && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.name.message}</p>}
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Client Email <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input 
                    {...register("email")}
                    type="email" 
                    placeholder="e.g. client@example.com" 
                    className={`w-full border rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all ${
                      errors.email ? "border-red-500" : "border-gray-200"
                    }`} 
                  />
                  {errors.email && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.email.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input 
                    {...register("company_name")}
                    type="text" 
                    placeholder="e.g. Acme Corp" 
                    className="w-full border-gray-200 border rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input 
                    {...register("website")}
                    type="text" 
                    placeholder="e.g. https://example.com" 
                    className={`w-full border rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all ${
                      errors.website ? "border-red-500" : "border-gray-200"
                    }`} 
                  />
                  {errors.website && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.website.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Mobile</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input 
                    {...register("mobile")}
                    type="text" 
                    placeholder="e.g. +1 234 567 890" 
                    className="w-full border-gray-200 border rounded p-2.5 pl-9 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none transition-all" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Address</label>
                <textarea 
                  {...register("address")}
                  className="w-full border-gray-200 border rounded p-2.5 text-xs font-bold focus:ring-1 focus:ring-primary/20 outline-none h-20 transition-all"
                  placeholder="Street address..."
                ></textarea>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-50 flex items-center justify-end space-x-3">
              <Link href="/clients">
                <Button type="button" className="bg-white text-gray-500 border border-gray-200 text-[10px] font-black px-6 h-10 uppercase tracking-widest hover:bg-gray-50 transition-all">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={saving} className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center">
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-2" />
                )}
                {saving ? "Saving..." : "Save Client"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
