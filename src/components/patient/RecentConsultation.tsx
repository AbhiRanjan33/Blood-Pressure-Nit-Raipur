// components/patient/RecentConsultations.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Hourglass, AlertCircle } from "lucide-react";
import { format } from "date-fns";

// Define the shape of the data this component will fetch
interface ConsultRequest {
  _id: string;
  allergies: string;
  notes: string;
  medications: string;
  createdAt: string;
  status: string;
}

export default function RecentConsultations() {
  const { user } = useUser();
  const [recentStatus, setRecentStatus] = useState<ConsultRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Data fetching logic is self-contained within this component
  const fetchRequests = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/get-patient-consults?clerkId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      // Sort and slice the data directly within this component
      const recentRequests = (data.requests || [])
        .sort((a: ConsultRequest, b: ConsultRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 7);

      setRecentStatus(recentRequests);
    } catch (err) {
      console.error("Failed to fetch recent consultations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
      // Optional: set an interval if you want this component to auto-refresh
      const interval = setInterval(fetchRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

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
      <Card className="flex items-center justify-center p-12">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 rounded-full border-t-transparent" />
      </Card>
    );
  }

  return (
    <Card className="w-full flex flex-col">
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
  );
}