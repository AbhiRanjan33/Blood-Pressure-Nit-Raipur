import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { patientClerkId, doctorId, consultRequestId } = await req.json();

    if (!patientClerkId || !doctorId || !consultRequestId) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }

    // 1. Get patient + consult request + profile
    const patient = await User.findOne({ clerkId: patientClerkId });
    if (!patient || patient.role !== 'patient') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    const consultRequest = patient.consultRequests.id(consultRequestId);
    if (!consultRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    const patientName = patient.profile?.name || 'Unknown Patient';
    const patientAge = patient.profile?.age || null;

    // 2. Get doctor
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // 3. Push enhanced request
    doctor.consultRequests.push({
      ...consultRequest.toObject(),
      _id: new mongoose.Types.ObjectId(),
      assignedAt: new Date(),
      status: 'pending',
      patientName,
      patientAge,
    });

    await doctor.save();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Assign error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}