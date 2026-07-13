"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import api from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/context/ToastContext";
import { RefreshCw, Save, ArrowLeft, AlertCircle } from "lucide-react";
import { Client } from "@/types";

const clientSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  company_name: z.string().min(2, "Company name is required"),
  website: z.string().url("Invalid URL").optional().or(z.literal("")),
  mobile: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["active", "deactive"]),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response;
    return response?.data?.message || fallback;
  }
  return fallback;
};

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<Client | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
  });

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await api.get(`/client/${params.id}`);
        const data = response.data.data as Client;
        setClient(data);
        reset({
          name: data.name,
          email: data.email,
          company_name: data.client_detail?.company_name || "",
          website: data.client_detail?.website || "",
          mobile: data.client_detail?.mobile || "",
          address: data.client_detail?.address || "",
          status: data.status === "deactive" ? "deactive" : "active",
        });
      } catch (err) {
        console.error("Fetch Client Error:", err);
        showToast(getApiErrorMessage(err, "Failed to load client data."), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [params.id, reset, showToast]);

  const onSubmit = async (data: ClientFormValues) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: data.name,
        email: data.email,
        status: data.status,
        client_detail: {
          company_name: data.company_name,
          website: data.website,
          mobile: data.mobile,
          address: data.address
        }
      };
      
      await api.put(`/client/${params.id}`, payload);
      showToast("Client updated successfully!");
      router.push(`/clients/${params.id}`);
      router.refresh();
    } catch (err) {
      console.error("Update Client Error:", err);
      showToast(getApiErrorMessage(err, "Failed to update client."), "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading client data...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!client) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4 opacity-20" />
          <h2 className="text-lg font-black text-gray-800 uppercase tracking-widest mb-2">Client Not Found</h2>
          <Button onClick={() => router.push("/clients")} className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
            Back to Clients
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between -mx-6 -mt-6 mb-6">
           <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors">
                 <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                 <h1 className="text-base font-black text-gray-800 uppercase tracking-widest">Edit Client</h1>
                 <p className="text-[10px] text-gray-400 font-bold mt-0.5">Update details for {client.client_detail?.company_name || client.name}</p>
              </div>
           </div>
           <div className="flex items-center space-x-3">
              <Button onClick={() => router.back()} className="bg-gray-50 text-gray-500 border-none px-6 h-10 text-[10px] font-black uppercase tracking-widest">Cancel</Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={saving} className="bg-primary text-white text-[10px] font-black px-6 h-10 uppercase tracking-widest shadow-lg shadow-primary/20">
                 {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                 {saving ? "Updating..." : "Update Client"}
              </Button>
           </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-6">
              <Card title="Company Information" className="border-none shadow-sm p-8 bg-white">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Name <span className="text-red-500">*</span></label>
                       <input 
                          type="text" 
                          {...register("company_name")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none ${errors.company_name ? "ring-1 ring-red-500" : "focus:ring-primary"}`} 
                       />
                       {errors.company_name && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.company_name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Company Website</label>
                       <input 
                          type="text" 
                          {...register("website")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none ${errors.website ? "ring-1 ring-red-500" : "focus:ring-primary"}`} 
                       />
                       {errors.website && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.website.message}</p>}
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Office Address</label>
                       <textarea 
                          {...register("address")}
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none h-24"
                       />
                    </div>
                 </div>
              </Card>

              <Card title="Primary Contact" className="border-none shadow-sm p-8 bg-white">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Name <span className="text-red-500">*</span></label>
                       <input 
                          type="text" 
                          {...register("name")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none ${errors.name ? "ring-1 ring-red-500" : "focus:ring-primary"}`} 
                       />
                       {errors.name && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address <span className="text-red-500">*</span></label>
                       <input 
                          type="email" 
                          {...register("email")}
                          className={`w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 outline-none ${errors.email ? "ring-1 ring-red-500" : "focus:ring-primary"}`} 
                       />
                       {errors.email && <p className="text-[9px] text-red-500 mt-1 font-bold">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
                       <input 
                          type="text" 
                          {...register("mobile")}
                          className="w-full bg-gray-50 border-none rounded-xl p-3 text-xs font-bold focus:ring-1 focus:ring-primary outline-none" 
                       />
                    </div>
                 </div>
              </Card>
           </div>

           <div className="space-y-6">
              <Card title="Client Status" className="border-none shadow-sm p-8 bg-white text-center">
                 <div className="h-32 w-32 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-inner border border-blue-50 mx-auto mb-6 text-3xl font-black uppercase">
                    {client.client_detail?.company_name?.charAt(0) || client.name.charAt(0)}
                 </div>
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Account Status</label>
                 <select
                    {...register("status")}
                    className="w-full rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs font-black uppercase tracking-widest text-gray-700 outline-none focus:ring-1 focus:ring-primary"
                 >
                    <option value="active">Active</option>
                    <option value="deactive">Disabled</option>
                 </select>
              </Card>

              <Card title="Quick Stats" className="border-none shadow-sm p-8 bg-white">
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Client ID</p>
                       <p className="text-xs font-black text-gray-800">#{client.id}</p>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">User Type</p>
                       <p className="text-xs font-black text-gray-800 uppercase">Client</p>
                    </div>
                 </div>
              </Card>
           </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
