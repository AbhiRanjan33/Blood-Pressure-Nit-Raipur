// src/app/api/complete-consultation/route.ts
import { NextRequest, NextResponse } from "next/server";
import {connectDB} from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { consultationId, prescription } = await req.json();

    if (!consultationId || !prescription?.trim()) {
      return NextResponse.json({ message: "Missing data" }, { status: 400 });
    }

    // STEP 1: Update DOCTOR SIDE using $set with positional operator
    const doctorUpdate = await User.updateOne(
      {
        "consultRequests._id": consultationId,
        role: "doctor"
      },
      {
        $set: {
          "consultRequests.$.prescription": prescription.trim(),
          "consultRequests.$.status": "completed",
          "consultRequests.$.completedAt": new Date()
        }
      }
    );

    if (doctorUpdate.matchedCount === 0) {
      return NextResponse.json({ message: "Consult not found in doctor" }, { status: 404 });
    }

    // STEP 2: Get the consultation to sync with patient
    const doctor = await User.findOne({
      "consultRequests._id": consultationId,
      role: "doctor"
    });

    const consult = doctor?.consultRequests.id(consultationId);
    if (!consult) {
      return NextResponse.json({ message: "Failed to retrieve consult" }, { status: 500 });
    }

    // STEP 3: Update PATIENT SIDE
    await User.findByIdAndUpdate(
      consult.patientId,
      {
        $set: {
          "consultRequests.$[elem].status": "completed",
          "consultRequests.$[elem].prescription": prescription.trim(),
          "consultRequests.$[elem].completedAt": new Date()
        }
      },
      {
        arrayFilters: [
          {
            "elem.vitals": consult.vitals,
            "elem.allergies": consult.allergies,
            "elem.notes": consult.notes,
            "elem.medications": consult.medications,
            "elem.createdAt": consult.createdAt
          }
        ]
      }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Complete consultation error:", error);
    return NextResponse.json({ message: error.message || "Server error" }, { status: 500 });
  }
}