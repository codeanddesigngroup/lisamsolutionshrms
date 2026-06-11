import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { Layers, Clock, Download } from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "Total Projects", value: "12", icon: Layers, color: "bg-success-gradient", href: "/projects" },
  { label: "Total Hours Logged", value: "156 hrs", icon: Clock, color: "bg-warning-gradient", href: "/time-logs" },
  { label: "Total Overdue Projects", value: "2", icon: Layers, color: "bg-danger-gradient", href: "/projects" },
];

const pendingMilestones = [
  { title: "Design Phase", project: "Website Redesign", amount: "$500.00" },
  { title: "App API", project: "Mobile App", amount: "$1,200.00" },
  { title: "Unit Testing", project: "API Integration", amount: "$800.00" },
];

export default function ProjectDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white px-6 py-4 shadow-sm -mx-6 -mt-6 mb-6">
          <h1 className="text-base font-semibold text-gray-700">Project Dashboard</h1>
          <ol className="flex text-sm text-gray-500 space-x-1">
            <li><Link href="/dashboard" className="hover:text-primary">Home</Link></li>
            <li>/</li>
            <li className="text-gray-700">Project Dashboard</li>
          </ol>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <Link key={i} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-700">{stat.value}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart Card */}
          <Card className="p-0">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Status Wise Project</h3>
              <button className="text-gray-400 hover:text-primary flex items-center space-x-1 text-xs font-medium">
                <Download className="h-3 w-3" />
                <span>Download</span>
              </button>
            </div>
            <div className="p-6">
              <div className="h-64 flex items-center justify-center relative">
                {/* Mock Doughnut Chart */}
                <div className="w-48 h-48 rounded-full border-[20px] border-green-500 border-t-blue-500 border-r-yellow-500 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-gray-700">12</span>
                    <p className="text-[10px] text-gray-400 uppercase">Projects</p>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-center gap-4 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center"><span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span> In Progress</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span> On Hold</div>
                <div className="flex items-center"><span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span> Finished</div>
              </div>
            </div>
          </Card>

          {/* Pending Milestones Card */}
          <Card className="p-0">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700">Pending Milestone</h3>
            </div>
            <div className="p-0">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Milestone</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Project</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pendingMilestones.map((milestone, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <Link href="#" className="text-xs font-medium text-primary hover:underline">{milestone.title}</Link>
                      </td>
                      <td className="px-6 py-3">
                        <Link href="#" className="text-xs text-gray-600 hover:underline">{milestone.project}</Link>
                      </td>
                      <td className="px-6 py-3 text-xs font-bold text-gray-700">{milestone.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
