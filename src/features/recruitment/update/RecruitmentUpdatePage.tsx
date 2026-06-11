"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import Button from "@/components/ui/Button";
import { RefreshCw, Download, Info } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function RecruitmentUpdatePage() {
  const [checking, setChecking] = useState(false);
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="row bg-title mb-6">
          <div className="col-lg-3 col-md-4 col-sm-4 col-xs-12">
            <h4 className="page-title m-0"><RefreshCw className="h-5 w-5 mr-2 inline-block text-primary" /> Update Application</h4>
          </div>
          <div className="col-sm-9 text-right flex justify-end items-center space-x-2">
            <ol className="breadcrumb hidden-xs">
              <li><Link href="/dashboard">Home</Link></li>
              <li><Link href="/recruitment/dashboard">Recruitment</Link></li>
              <li className="active">Update</li>
            </ol>
          </div>
        </div>

        <div className="white-box">
          <h3 className="box-title">System Details</h3>
          <hr className="my-6 border-[#f2f2f3]" />
          
          <div className="bg-[#d9edf7] border border-[#bce8f1] p-6 rounded text-[#31708f] mb-8">
            <div className="flex">
               <Info className="h-6 w-6 mr-3 flex-shrink-0" />
               <p className="text-[13px]">To update the app to new version check documentation for the instructions.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#f2f2f3] pb-4">
              <span className="text-[13px] font-bold text-gray-600 uppercase">App Version</span>
              <span className="label label-success">1.2.0</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#f2f2f3] pb-4">
              <span className="text-[13px] font-bold text-gray-600 uppercase">Laravel Version</span>
              <span className="text-[13px] font-medium">7.x</span>
            </div>
            
            <div className="pt-6">
              <Button 
                className="btn-info" 
                onClick={() => { setChecking(true); setTimeout(() => setChecking(false), 2000); }}
                disabled={checking}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} /> 
                {checking ? 'Checking for updates...' : 'Check for Update'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
