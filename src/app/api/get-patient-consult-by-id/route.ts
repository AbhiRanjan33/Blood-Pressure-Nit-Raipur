// src/app/api/get-patient-consult-by-id/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Consultation ID is required" },
        { status: 400 }
      );
    }

    // Find user who has a consultRequest with this _id
    const user = await User.findOne(
      { "consultRequests._id": id },
      {
        "consultRequests.$": 1,
        role: 1,
        clerkId: 1,
      }
    );

    if (!user || !user.consultRequests || user.consultRequests.length === 0) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    const consult = user.consultRequests[0];

    // Ensure prescription exists and status is completed
    if (consult.status !== "completed" || !consult.prescription) {
      return NextResponse.json(
        { error: "Prescription not available" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      consult: {
        _id: consult._id.toString(),
        prescription: consult.prescription,
        completedAt: consult.completedAt,
        vitals: consult.vitals,
        notes: consult.notes,
        allergies: consult.allergies,
        medications: consult.medications,
      },
    });
  } catch (error) {
    console.error("get-patient-consult-by-id error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}