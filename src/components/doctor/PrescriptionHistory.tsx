// components/doctor/PrescriptionHistory.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Clock, User, Copy, Download, Heart } from "lucide-react";
import { format } from "date-fns";

interface Prescription {
  _id: string;
  patientName: string;
  patientAge: string | number;
  vitals: string;
  prescription: string;
  completedAt: string;
}

export default function PrescriptionHistory() {
  const { user } = useUser();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrescriptions = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/doctor-prescriptions?clerkId=${user.id}`);
      const data = await res.json();
      setPrescriptions(data.prescriptions || []);
    } catch (err) {
      console.error("Failed to load prescription history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    const interval = setInterval(fetchPrescriptions, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [user?.id]);

  const copyPrescription = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Prescription copied!");
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-green-600 rounded-full border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600">Loading your prescription history...</p>
      </Card>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <Card className="p-16 text-center border-2 border-dashed border-green-200">
        <FileText className="h-20 w-20 mx-auto text-green-300 mb-6" />
        <p className="text-2xl font-bold text-gray-700">No prescriptions yet</p>
        <p className="text-gray-500 mt-3">Complete a consultation to see history here</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <FileText className="h-12 w-12 text-green-700" />
        <div>
          <h2 className="text-3xl font-bold text-green-700">Prescription History</h2>
          <p className="text-gray-600">All completed consultations</p>
        </div>
      </div>

      <div className="grid gap-6">
        {prescriptions.map((p) => (
          <Card key={p._id} className="overflow-hidden shadow-xl border-2 border-green-100 hover:border-green-400 transition-all duration-300">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b-2 border-green-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {p.patientName}, {p.patientAge} yrs
                  </h3>
                  <div className="flex flex-wrap gap-6 mt-3 text-sm text-gray-700">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-700" />
                      {format(new Date(p.completedAt), "dd MMM yyyy")}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-green-700" />
                      {format(new Date(p.completedAt), "hh:mm a")}
                    </span>
                    <span className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-600" />
                      BP: {p.vitals}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => copyPrescription(p.prescription)}
                  >
                    <Copy className="h-5 w-5 mr-2" />
                    Copy
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Download className="h-5 w-5 mr-2" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white">
              <pre className="whitespace-pre-wrap font-medium text-gray-800 text-lg leading-relaxed font-mono">
                {p.prescription}
              </pre>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}