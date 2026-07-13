"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  Plus, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Check, 
  ChevronRight,
  Settings,
  Calendar,
  X
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useToast } from "@/context/ToastContext";

export default function LeavesSettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [leaveStartFrom, setLeaveStartFrom] = useState('joining_date');
  const [leaveTypes, setLeaveTypes] = useState([
    { id: 1, name: "Casual", leaves: 12, paid: 1, color: "info" },
    { id: 2, name: "Sick", leaves: 12, paid: 1, color: "success" },
    { id: 3, name: "Earned", leaves: 15, paid: 1, color: "danger" },
  ]);

  const [newLeaveType, setNewLeaveType] = useState({
    name: "",
    leaves: 0,
    color: "info",
    toAll: false
  });

  const handleUpdateType = async (id: number) => {
    showToast("Leave type updated", "success");
  };

  const handleDeleteType = async (id: number) => {
    setLeaveTypes(leaveTypes.filter(t => t.id !== id));
    showToast("Leave type deleted", "success");
  };

  const handleCreateType = (e: React.FormEvent) => {
    e.preventDefault();
    const id = Math.max(...leaveTypes.map(t => t.id)) + 1;
    setLeaveTypes([...leaveTypes, { ...newLeaveType, id: id, paid: 1 } as any]);
    setNewLeaveType({ name: "", leaves: 0, color: "info", toAll: false });
    showToast("Leave type created", "success");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Header Section */}
        <div className="row bg-title mb-6">
            <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
                <h4 className="page-title m-0">
                    <Settings className="h-5 w-5 mr-2 inline-block text-primary" /> 
                    Leave Settings
                </h4>
            </div>
            <div className="col-lg-9 col-sm-8 col-md-8 col-xs-12 flex justify-end">
                <ol className="breadcrumb">
                    <li><Link href="/dashboard">Home</Link></li>
                    <li className="active">Leave Settings</li>
                </ol>
            </div>
        </div>

        <div className="panel panel-inverse white-box">
            <div className="panel-heading border-b border-[#f2f2f3] pb-4 mb-6">
                Update Leave Settings
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation (Legacy vtabs) */}
                <div className="w-full lg:w-64 border-r border-[#f2f2f3]">
                    <nav className="flex flex-col">
                        <button className="flex items-center px-6 py-4 text-[12px] font-bold uppercase tracking-wider bg-[#03a9f3] text-white transition-all">
                            <Calendar className="h-4 w-4 mr-3" />
                            Leave Settings
                        </button>
                    </nav>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    <div className="mb-10">
                        <div className="flex space-x-6 mb-8">
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="startFrom" 
                                    checked={leaveStartFrom === 'joining_date'}
                                    onChange={() => setLeaveStartFrom('joining_date')}
                                    className="mr-2" 
                                />
                                <span className="text-[12px] font-bold text-gray-600">Count Leaves From Date of Joining</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="startFrom" 
                                    checked={leaveStartFrom === 'year_start'}
                                    onChange={() => setLeaveStartFrom('year_start')}
                                    className="mr-2" 
                                />
                                <span className="text-[12px] font-bold text-gray-600">Count Leaves From Start of Year</span>
                            </label>
                        </div>

                        <div className="table-responsive">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Leave Type</th>
                                        <th>No. of Leaves</th>
                                        <th>Paid Status</th>
                                        <th className="text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaveTypes.map((type) => (
                                        <tr key={type.id}>
                                            <td>
                                                <span className={`label label-${type.color}`}>{type.name}</span>
                                            </td>
                                            <td>
                                                <input 
                                                    type="number" 
                                                    className="form-control w-24" 
                                                    defaultValue={type.leaves}
                                                />
                                            </td>
                                            <td>
                                                <select className="form-control w-32">
                                                    <option value="1">Paid</option>
                                                    <option value="0">Unpaid</option>
                                                </select>
                                            </td>
                                            <td className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <button onClick={() => handleUpdateType(type.id)} className="btn-success btn-outline p-1 rounded-full"><Check className="h-4 w-4" /></button>
                                                    <button onClick={() => handleDeleteType(type.id)} className="btn-danger btn-outline p-1 rounded-full"><X className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="border-t border-[#f2f2f3] pt-8">
                        <h4 className="box-title text-sm font-bold uppercase mb-6">Create Leave Type</h4>
                        <form onSubmit={handleCreateType} className="space-y-4 max-w-xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Leave Type Name</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={newLeaveType.name}
                                        onChange={(e) => setNewLeaveType({...newLeaveType, name: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Color</label>
                                    <select 
                                        className="form-control"
                                        value={newLeaveType.color}
                                        onChange={(e) => setNewLeaveType({...newLeaveType, color: e.target.value})}
                                    >
                                        <option value="info">Blue</option>
                                        <option value="success">Green</option>
                                        <option value="danger">Red</option>
                                        <option value="warning">Yellow</option>
                                        <option value="primary">Purple</option>
                                        <option value="inverse">Grey</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">No. of Leaves</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={newLeaveType.leaves}
                                        onChange={(e) => setNewLeaveType({...newLeaveType, leaves: parseInt(e.target.value)})}
                                        min="0"
                                    />
                                </div>
                                <div className="form-group flex items-end pb-1">
                                    <label className="flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="mr-2" 
                                            checked={newLeaveType.toAll}
                                            onChange={(e) => setNewLeaveType({...newLeaveType, toAll: e.target.checked})}
                                        />
                                        <span className="text-[11px] font-bold text-gray-600 uppercase">To All Employees</span>
                                    </label>
                                </div>
                            </div>
                            <div className="form-actions pt-4">
                                <Button type="submit" className="btn-success">
                                    <Check className="h-4 w-4 mr-2" /> Save Leave Type
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
