// components/patient/PatientPrescriptionHistory.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Clock, CheckCircle2, Hourglass, AlertCircle, Search } from "lucide-react";
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
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case "under review":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200"><Hourglass className="h-3 w-3 mr-1" /> Under Review</Badge>;
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
    <div className="flex flex-col lg:flex-row gap-10 w-full">
      {/* COMPLETED PRESCRIPTIONS - NEW CARD DESIGN */}
      <Card className="w-full lg:w-1/2 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-green-700">
            <FileText className="h-7 w-7" />
            <div className="flex flex-col">
              My Prescriptions
              <span className="text-sm font-normal text-gray-600 mt-1">(Last 7 completed)</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          {completed.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 h-full flex flex-col justify-center">
              <FileText className="h-20 w-20 mx-auto text-gray-300 mb-4" />
              <p className="text-xl font-semibold text-gray-600">No prescriptions yet</p>
              <p className="text-sm text-gray-500 mt-2">Your completed consultations will appear here</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-gray-800">Date & Vitals</TableHead>
                    <TableHead className="font-bold text-gray-800">Prescription</TableHead>
                    <TableHead className="text-right font-bold text-gray-800">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completed.map((c) => (
                    <TableRow key={c._id} className="hover:bg-gray-50 transition-colors">
                      <TableCell className="font-medium w-[150px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-green-700" />
                          {format(new Date(c.completedAt!), "dd MMM yyyy")}
                        </div>
                        <div className="text-xs text-gray-600 flex items-center gap-1.5 mt-2">
                          BP: <span className="font-mono font-semibold">{c.vitals}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <pre className="whitespace-pre-wrap font-sans text-sm font-medium text-gray-800">
                          {c.prescription}
                        </pre>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                          onClick={() => router.push(`/patient/medicine-search/${c._id}`)}
                        >
                          <Search className="h-4 w-4 mr-1" />
                          Find Best Price
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RECENT STATUS - NEW CARD DESIGN */}
      <Card className="w-full lg:w-1/2 flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-blue-700">
            <CheckCircle2 className="h-7 w-7" />
             <div className="flex flex-col">
              Consultation Status
              <span className="text-sm font-normal text-gray-600 mt-1">(Last 7 requests)</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-gray-800">Requested On</TableHead>
                  <TableHead className="font-bold text-gray-800">Symptoms & Notes</TableHead>
                  <TableHead className="font-bold text-gray-800">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentStatus.map((r) => (
                  <TableRow key={r._id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="w-[150px]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-4 w-4 text-blue-700" />
                        {format(new Date(r.createdAt), "dd MMM yyyy")}
                      </div>
                      <div className="text-xs text-gray-600 mt-1 ml-1">
                        {format(new Date(r.createdAt), "hh:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-xs">
                        <span className="font-semibold text-gray-700">Notes:</span> {r.notes}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Allergies: <span className="font-medium text-gray-600">{r.allergies}</span> | 
                        Meds: <span className="font-medium text-gray-600">{r.medications}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}