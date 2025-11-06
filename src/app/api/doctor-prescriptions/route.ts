// src/app/api/doctor-prescriptions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const clerkId = searchParams.get("clerkId");

    if (!clerkId) {
      return NextResponse.json({ prescriptions: [] });
    }

    const doctor = await User.findOne(
      { clerkId, role: "doctor" },
      { consultRequests: 1, doctorProfile: 1 }
    );

    if (!doctor || !doctor.consultRequests) {
      return NextResponse.json({ prescriptions: [] });
    }

    const completed = doctor.consultRequests
      .filter((c: any) => 
        c.status === "completed" && 
        c.prescription && 
        c.prescription.trim().length > 0
      )
      .map((c: any) => ({
        _id: c._id.toString(),
        patientName: c.patientName || "Unknown Patient",
        patientAge: c.patientAge || "N/A",
        vitals: c.vitals || "N/A",
        prescription: c.prescription,
        completedAt: c.completedAt,
      }))
      .sort((a: any, b: any) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

    return NextResponse.json({ prescriptions: completed });
  } catch (error) {
    console.error("Doctor prescriptions fetch error:", error);
    return NextResponse.json({ prescriptions: [] });
  }
}