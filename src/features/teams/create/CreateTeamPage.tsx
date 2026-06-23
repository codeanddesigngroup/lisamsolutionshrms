"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Briefcase, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/context/ToastContext";

export default function CreateTeamPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const closeAndReset = () => {
    setName("");
    router.push("/teams");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/departments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || result.error || "Failed to create department"
        );
      }

      showToast("Department created successfully", "success");

      closeAndReset();
    } catch (error: any) {
      console.error("Create Department Error:", error);
      setError(error.message || "Something went wrong");
      showToast(error.message || "Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6 border-b border-gray-100">
          <div>
            <h1 className="text-base font-semibold text-gray-700 uppercase tracking-widest font-black">
              Add Department
            </h1>

            <div className="text-xs text-gray-500 flex items-center space-x-1 mt-1">
              <Link href="/dashboard" className="font-bold uppercase">
                Home
              </Link>
              <span>/</span>
              <Link href="/teams" className="font-bold uppercase">
                Departments
              </Link>
              <span>/</span>
              <span className="text-gray-700 font-bold uppercase">Add</span>
            </div>
          </div>

          <Link href="/teams">
            <Button className="bg-gray-100 text-gray-600 text-[10px] font-black h-8 px-4 uppercase">
              <ArrowLeft className="h-3 w-3 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        {/* Form */}
        <Card className="p-8 max-w-4xl mx-auto">
          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm font-bold border-l-4 border-red-500">
                {error}
              </div>
            )}

            {/* Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase">
                Department Name <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded p-2.5 pl-9 text-xs font-bold"
                  placeholder="Enter department name"
                  required
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="pt-6 border-t flex justify-end gap-3">
              <Link href="/teams">
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
                ) : null}
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}