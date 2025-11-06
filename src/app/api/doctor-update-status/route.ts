// src/app/api/doctor-update-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { consultId, status } = await req.json();
    const clerkId = new URL(req.url).searchParams.get('clerkId');

    if (!clerkId || !consultId || !['under review', 'denied'].includes(status)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    const doctor = await User.findOne({ clerkId, role: 'doctor' });
    if (!doctor) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const consult = doctor.consultRequests.id(consultId);
    if (!consult) return NextResponse.json({ error: 'Consult not found' }, { status: 404 });

    const patientId = consult.patientId;
    if (!patientId) return NextResponse.json({ error: 'Patient ID missing' }, { status: 400 });

    const patient = await User.findById(patientId);
    if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });

    // Find matching request in patient by exact fields + createdAt
    const patientRequest = patient.consultRequests.find((r: any) =>
      r.vitals === consult.vitals &&
      r.allergies === consult.allergies &&
      r.notes === consult.notes &&
      r.medications === consult.medications &&
      new Date(r.createdAt).getTime() === new Date(consult.createdAt).getTime()
    );

    // === UPDATE STATUS ===
    if (status === 'denied') {
      doctor.consultRequests.pull(consultId); // remove from doctor
      if (patientRequest) patientRequest.status = 'denied';
    } else {
      consult.status = 'under review'; // keep in doctor
      if (patientRequest) patientRequest.status = 'under review';
    }

    await Promise.all([doctor.save(), patient.save()]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}