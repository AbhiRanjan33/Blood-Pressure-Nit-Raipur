// src/app/api/get-doctors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const doctors = await User.find(
      { 
        role: 'doctor',
        'doctorProfile': { $exists: true, $ne: null } // ← CRITICAL
      },
      { 'doctorProfile': 1, _id: 1 }
    ).lean();

    if (!doctors || doctors.length === 0) {
      return NextResponse.json({ doctors: [] });
    }

    const formattedDoctors = doctors
      .filter(doc => doc.doctorProfile && typeof doc.doctorProfile === 'object')
      .map(doc => ({
        _id: doc._id.toString(),
        doctorProfile: {
          name: doc.doctorProfile.name || 'Dr. Unknown',
          registrationId: doc.doctorProfile.registrationId || 'N/A',
          photoUrl: doc.doctorProfile.photoUrl || null,
          experience: doc.doctorProfile.experience || 0,
          hospitalName: doc.doctorProfile.hospitalName || 'Clinic',
        }
      }));

    return NextResponse.json({ doctors: formattedDoctors });
  } catch (err) {
    console.error('Get Doctors Error:', err);
    return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
  }
}