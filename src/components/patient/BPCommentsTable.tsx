"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, Clock } from "lucide-react";

interface Comment {
  time: string;
  date: string;
  notes: string;
}

export default function BPCommentsTable() {
  const { user, isLoaded } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/bp-comments?clerkId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const result = await res.json();
      setComments(result.comments || []);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Comments Error:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && user) {
      fetchComments();
    }
  }, [isLoaded, user]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.id) fetchComments();
    }, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comments.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-purple-600" />
            Recent Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No notes in the last 7 days.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-purple-600" />
          Recent Notes (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Time
                  </div>
                </TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((c, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">
                    {c.time}
                    <div className="text-xs text-gray-500">{c.date}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {c.notes}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}