// components/patient/CompletedPrescriptions.tsx
"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Search } from "lucide-react";
import { format } from "date-fns";

// Define the shape of the data this component will fetch
interface ConsultRequest {
  _id: string;
  vitals: string;
  status: string;
  prescription?: string;
  completedAt?: string;
  createdAt: string; // Keep for sorting
}

export default function CompletedPrescriptions() {
  const { user } = useUser();
  const router = useRouter();
  const [completed, setCompleted] = useState<ConsultRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Data fetching logic is self-contained within this component
  const fetchRequests = async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/get-patient-consults?clerkId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      // Filter and sort the data directly within this component
      const completedRequests = (data.requests || [])
        .filter((r: ConsultRequest) => r.status === "completed" && r.prescription)
        .sort((a: ConsultRequest, b: ConsultRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 7);
        
      setCompleted(completedRequests);
    } catch (err) {
      console.error("Failed to fetch completed prescriptions", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchRequests();
      // Optional: set an interval if you want this component to auto-refresh
      const interval = setInterval(fetchRequests, 15000); // Using a slightly different interval
      return () => clearInterval(interval);
    }
  }, [user?.id]);
  
  if (loading) {
    return (
      <Card className="flex items-center justify-center p-12">
        <div className="animate-spin h-10 w-10 border-4 border-green-500 rounded-full border-t-transparent" />
      </Card>
    );
  }

  return (
    <Card className="w-full flex flex-col">
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
                        {c.completedAt ? format(new Date(c.completedAt), "dd MMM yyyy") : "N/A"}
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
  );
}