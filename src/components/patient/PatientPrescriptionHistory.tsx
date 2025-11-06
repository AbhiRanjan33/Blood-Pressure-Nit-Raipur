// components/patient/PatientPrescriptionHistory.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Clock, CheckCircle2, Hourglass, AlertCircle, Search, Pill } from "lucide-react";
import { format } from "date-fns";

interface ConsultRequest {
  _id: string;
  vitals: string;
  allergies: string;
  notes: string;
  medications: string;
  createdAt: string;
  status: string;
  prescription?: string;
  completedAt?: string;
}

export default function PatientPrescriptionHistory() {
  const { user } = useUser();
  const router = useRouter();
  const [allRequests, setAllRequests] = useState<ConsultRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/get-patient-consults?clerkId=${user.id}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const sorted = (data.requests || [])
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllRequests(sorted);
    } catch (err) {
      console.error("Failed to fetch patient consults");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const completed = allRequests
    .filter(r => r.status === "completed" && r.prescription)
    .slice(0, 7);

  const recentStatus = allRequests.slice(0, 7);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600 text-white"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case "under review":
        return <Badge className="bg-blue-600 text-white"><Hourglass className="h-3 w-3 mr-1" /> Under Review</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="p-16 text-center">
        <div className="animate-spin h-14 w-14 border-4 border-green-600 rounded-full border-t-transparent mx-auto mb-4" />
        <p className="text-lg text-gray-600">Loading your health history...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {/* COMPLETED PRESCRIPTIONS */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-green-700">
          <FileText className="h-9 w-9" />
          My Prescriptions
          <span className="text-sm font-normal text-gray-600">(Last 7 completed)</span>
        </h2>

        {completed.length === 0 ? (
          <Card className="p-12 text-center border-2 border-dashed border-green-200">
            <FileText className="h-20 w-20 mx-auto text-green-300 mb-4" />
            <p className="text-xl font-semibold text-gray-600">No prescriptions yet</p>
            <p className="text-sm text-gray-500 mt-2">Your completed consultations will appear here</p>
          </Card>
        ) : (
          <Card className="shadow-lg border-green-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="font-bold">Date & Time</TableHead>
                  <TableHead className="font-bold">BP</TableHead>
                  <TableHead className="font-bold">Prescription</TableHead>
                  <TableHead className="text-right font-bold">Search</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completed.map((c) => (
                  <TableRow key={c._id} className="hover:bg-green-50 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-green-700" />
                        {format(new Date(c.completedAt!), "dd MMM yyyy")}
                      </div>
                      <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(c.completedAt!), "hh:mm a")}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono font-semibold">{c.vitals}</TableCell>
                    <TableCell>
                      <pre className="whitespace-pre-wrap text-sm font-medium text-gray-800">
                        {c.prescription}
                      </pre>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold"
                        onClick={() => router.push(`/patient/medicine-search/${c._id}`)}
                      >
                        <Search className="h-4 w-4 mr-1" />
                        Search Best Price
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* RECENT STATUS */}
      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-blue-700">
          <CheckCircle2 className="h-9 w-9" />
          Recent Consultation Status
          <span className="text-sm font-normal text-gray-600">(Last 7 requests)</span>
        </h2>

        <Card className="shadow-lg border-blue-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50">
                <TableHead className="font-bold">Requested On</TableHead>
                <TableHead className="font-bold">Symptoms & Notes</TableHead>
                <TableHead className="font-bold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentStatus.map((r) => (
                <TableRow key={r._id} className="hover:bg-blue-50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium">
                      <Calendar className="h-4 w-4 text-blue-700" />
                      {format(new Date(r.createdAt), "dd MMM yyyy")}
                    </div>
                    <div className="text-xs text-gray-600">
                      {format(new Date(r.createdAt), "hh:mm a")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700">Notes:</span> {r.notes}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Allergies: <span className="font-medium">{r.allergies}</span> | 
                      Meds: <span className="font-medium">{r.medications}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(r.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}