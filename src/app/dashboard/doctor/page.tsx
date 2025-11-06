import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stethoscope, FileCheck, Activity } from "lucide-react"; // Added Activity

export default function DoctorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Stethoscope className="text-blue-600" /> Doctor Dashboard
          </h1>
          <SignOutButton>
            <Button variant="outline">Sign Out</Button>
          </SignOutButton>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <FileCheck className="h-10 w-10 text-purple-600 mb-4" />
            <h2 className="text-xl font-semibold">Review AI Suggestions</h2>
            <p className="text-gray-600">Approve or modify prescriptions</p>
            <Button className="mt-4 w-full">View Queue (3)</Button>
          </Card>

          <Card className="p-6">
            <Activity className="h-10 w-10 text-teal-600 mb-4" />
            <h2 className="text-xl font-semibold">Patient Trends</h2>
            <p className="text-gray-600">Monitor BP patterns over time</p>
            <Button variant="outline" className="mt-4 w-full">View Patients</Button>
          </Card>
        </div>
      </div>
    </div>
  );
}