// src/components/patient/ConsultationHistoryCard.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Stethoscope, Calendar, AlertCircle, Pill, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

interface ConsultRequest {
  vitals: string;
  allergies: string;
  notes: string;
  medications: string;
  createdAt: string;
}

export default function ConsultationHistoryCard() {
  const { user, isLoaded } = useUser();
  const [requests, setRequests] = useState<ConsultRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ConsultRequest | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoaded && user?.id) {
      const fetchHistory = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/get-consult-history?clerkId=${user.id}`);
          if (!res.ok) throw new Error("Failed to load");
          const data = await res.json();
          // Sort by date DESC, take last 7
          const sorted = data.consultRequests
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 7);
          setRequests(sorted);
        } catch (err) {
          console.error("History fetch error:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchHistory();
    }
  }, [user?.id, isLoaded]);

  const openDetails = (req: ConsultRequest) => {
    setSelected(req);
    setOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-green-600" />
            Recent Consultations
          </CardTitle>
          <p className="text-sm text-gray-600">Last 7 requests</p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No consultation requests yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Date</TableHead>
                    <TableHead>Vitals</TableHead>
                    <TableHead>Allergies</TableHead>
                    <TableHead>Medications</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req, i) => (
                    <TableRow key={i} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetails(req)}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(req.createdAt), "MMM d")}
                        </div>
                      </TableCell>
                      <TableCell>{req.vitals}</TableCell>
                      <TableCell className="max-w-32 truncate">{req.allergies}</TableCell>
                      <TableCell className="max-w-32 truncate">{req.medications}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* DETAILS MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Consultation Details
            </DialogTitle>
            <DialogDescription>
              {selected && format(new Date(selected.createdAt), "PPP 'at' p")}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="flex items-center gap-1 font-semibold">
                  Vitals
                </Label>
                <p className="text-sm">{selected.vitals}</p>
              </div>
              <div>
                <Label className="flex items-center gap-1 font-semibold">
                  <AlertCircle className="h-4 w-4" /> Allergies
                </Label>
                <p className="text-sm">{selected.allergies}</p>
              </div>
              <div>
                <Label className="flex items-center gap-1 font-semibold">
                  <Pill className="h-4 w-4" /> Medications
                </Label>
                <p className="text-sm">{selected.medications}</p>
              </div>
              <div>
                <Label className="flex items-center gap-1 font-semibold">
                  Notes
                </Label>
                <p className="text-sm whitespace-pre-wrap">{selected.notes}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}