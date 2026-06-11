"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { 
  CheckSquare, 
  Plus, 
  Edit, 
  Trash2, 
  GripVertical,
  Check
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useToast } from "@/context/ToastContext";

export default function RecruitmentTodosPage() {
  const { showToast } = useToast();
  const [todos, setTodos] = useState([
    { id: 1, title: "Review frontend developer applications", status: "pending", position: 1 },
    { id: 2, title: "Schedule interview with Alice Johnson", status: "pending", position: 2 },
    { id: 3, title: "Prepare onboarding docs for Dan Brown", status: "pending", position: 3 },
    { id: 4, title: "Post new DevOps Engineer opening", status: "completed", position: 4 },
    { id: 5, title: "Send rejection emails to batch 3", status: "completed", position: 5 },
  ]);

  const toggleStatus = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, status: t.status === "pending" ? "completed" : "pending" } : t));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
    showToast("Task deleted", "success");
  };

  const pending = todos.filter(t => t.status === "pending");
  const completed = todos.filter(t => t.status === "completed");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0"><CheckSquare className="h-5 w-5 mr-2 inline-block text-primary" /> ToDo List</h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <Button className="btn-success btn-sm"><Plus className="h-4 w-4 mr-1" /> New Task</Button>
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">ToDos</li>
            </ol>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <div className="white-box">
            <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4">
              Pending Tasks <span className="text-primary ml-1">({pending.length})</span>
            </h4>
            <div className="space-y-0">
              {pending.map((todo) => (
                <div key={todo.id} className="flex items-center p-4 border-b border-[#f2f2f3] hover:bg-gray-50 transition-all group">
                  <GripVertical className="h-4 w-4 text-gray-200 mr-3 cursor-move" />
                  <input 
                    type="checkbox" 
                    className="mr-3 cursor-pointer" 
                    checked={false}
                    onChange={() => toggleStatus(todo.id)}
                  />
                  <span className="text-[13px] font-medium flex-1">{todo.title}</span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn-info btn-outline p-1 rounded hover:bg-info hover:text-white transition-all"><Edit className="h-3.5 w-3.5" /></button>
                    <button className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all" onClick={() => deleteTodo(todo.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              {pending.length === 0 && (
                <p className="text-[12px] text-gray-400 text-center py-8 italic">No pending tasks are available!</p>
              )}
            </div>
          </div>

          {/* Completed Tasks */}
          <div className="white-box">
            <h4 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-4">
              Completed Tasks <span className="text-success ml-1">({completed.length})</span>
            </h4>
            <div className="space-y-0">
              {completed.map((todo) => (
                <div key={todo.id} className="flex items-center p-4 border-b border-[#f2f2f3] hover:bg-gray-50 transition-all group opacity-60">
                  <GripVertical className="h-4 w-4 text-gray-200 mr-3 cursor-move" />
                  <input 
                    type="checkbox" 
                    className="mr-3 cursor-pointer" 
                    checked={true}
                    onChange={() => toggleStatus(todo.id)}
                  />
                  <span className="text-[13px] font-medium flex-1 line-through">{todo.title}</span>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="btn-info btn-outline p-1 rounded hover:bg-info hover:text-white transition-all"><Edit className="h-3.5 w-3.5" /></button>
                    <button className="btn-danger btn-outline p-1 rounded hover:bg-danger hover:text-white transition-all" onClick={() => deleteTodo(todo.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
              {completed.length === 0 && (
                <p className="text-[12px] text-gray-400 text-center py-8 italic">No tasks are marked as completed.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
