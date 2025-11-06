// components/patient/PatientPrescriptionHistory.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Clock, CheckCircle2, Hourglass, AlertCircle, Copy } from "lucide-react";
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

  const copyPrescription = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Prescription copied!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</Badge>;
      case "under review":
        return <Badge className="bg-blue-600"><Hourglass className="h-3 w-3 mr-1" /> Under Review</Badge>;
      default:
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" /> Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-green-600 rounded-full border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600">Loading your history...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {/* COMPLETED PRESCRIPTIONS */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-green-700">
          <FileText className="h-8 w-8" />
          My Prescriptions (Last 7 Completed)
        </h2>
        {completed.length === 0 ? (
          <Card className="p-10 text-center border-2 border-dashed border-gray-300">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-xl text-gray-500">No prescriptions yet</p>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead>Date</TableHead>
                  <TableHead>BP</TableHead>
                  <TableHead>Prescription</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completed.map((c) => (
                  <TableRow key={c._id} className="hover:bg-green-50">
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(c.completedAt!), "dd MMM yyyy")}
                      </div>
                      <div className="text-xs text-gray-500">
                        <Clock className="inline h-3 w-3" /> {format(new Date(c.completedAt!), "hh:mm a")}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{c.vitals}</TableCell>
                    <TableCell>
                      <pre className="whitespace-pre-wrap text-sm">{c.prescription}</pre>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => copyPrescription(c.prescription!)}>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
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
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-blue-700">
          <CheckCircle2 className="h-8 w-8" />
          Recent Consultation Status (Last 7)
        </h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50">
                <TableHead>Requested</TableHead>
                <TableHead>Symptoms</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentStatus.map((r) => (
                <TableRow key={r._id} className="hover:bg-blue-50">
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(r.createdAt), "dd MMM yyyy")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(r.createdAt), "hh:mm a")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">Notes:</span> {r.notes}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      Allergies: {r.allergies} | Meds: {r.medications}
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