"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Award,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function CreateDesignationPage() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const companyId = user?.company_id ? String(user.company_id) : "";

    if (!companyId) {
      showToast("No company is assigned to this login. Designation cannot be created.", "error");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const res = await fetch( `${process.env.NEXT_PUBLIC_API_BASE_URL}/designations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company_id: companyId,
          name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to create designation");
      }

      showToast("Designation created successfully", "success");

      // reset form
      setName("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      showToast(err.message || "Error", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex justify-between bg-white px-6 py-4 shadow-sm border-b">
          <div>
            <h1 className="text-base font-black uppercase">
              Add Designation
            </h1>
          </div>

          <Link href="/designation">
            <Button className="bg-gray-100 text-gray-600 text-[10px] font-black h-8 px-4 uppercase">
              <ArrowLeft className="h-3 w-3 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* FORM */}
        <Card className="p-8 max-w-2xl mx-auto">

          <form className="space-y-6" onSubmit={handleSubmit}>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-bold border-l-4 border-red-500">
                {error}
              </div>
            )}

            {/* INPUT */}
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase">
                Designation Name
              </label>

              <div className="relative mt-2">
                <Award className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                  placeholder="e.g. Senior Developer"
                  className="w-full border rounded px-3 py-2 pl-9 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  required
                />
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex justify-end gap-3 pt-4 border-t">

              <Link href="/designation">
                <Button
                  type="button"
                  className="bg-gray-100 text-gray-600 text-[10px] font-black px-6 h-10 uppercase"
                >
                  Cancel
                </Button>
              </Link>

              <Button
                type="submit"
                disabled={saving}
                className="bg-primary text-white text-[10px] font-black px-8 h-10 uppercase flex items-center"
              >
                {saving ? (
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-2" />
                )}

                {saving ? "Saving..." : "Save Designation"}
              </Button>
            </div>

          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
