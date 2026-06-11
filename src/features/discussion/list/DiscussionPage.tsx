import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Plus } from "lucide-react";

export default function DiscussionPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6">
          <div>
            <h1 className="text-lg font-semibold text-gray-800">Discussion</h1>
            <div className="text-sm text-gray-500">Home / Discussion</div>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Add Discussion</span>
          </Button>
        </div>

        <Card>
          <div className="p-12 text-center">
            <h2 className="text-2xl font-bold text-gray-300 mb-4">Discussion Module</h2>
            <p className="text-gray-500">
              This page has been automatically scaffolded. UI to be implemented based on the original Laravel blade templates.
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
