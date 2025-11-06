// src/app/api/save-patient-profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { clerkId, ...profileData } = body;

    if (!clerkId) {
      return NextResponse.json({ error: 'clerkId required' }, { status: 400 });
    }

    const profile = {
      name: profileData.name?.trim(),  // ← NEW
      gender: profileData.gender,
      age: Number(profileData.age),
      height: Number(profileData.height),
      weight: Number(profileData.weight),
      smoker: profileData.smoker,
      hypertension_treated: profileData.hypertension_treated,
      family_history_of_cardiovascular_disease: profileData.family_history_of_cardiovascular_disease,
      atrial_fibrillation: profileData.atrial_fibrillation,
      chronic_kidney_disease: profileData.chronic_kidney_disease,
      rheumatoid_arthritis: profileData.rheumatoid_arthritis,
      diabetes: profileData.diabetes,
      chronic_obstructive_pulmonary_disorder: profileData.chronic_obstructive_pulmonary_disorder,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedUser = await User.findOneAndUpdate(
      { clerkId },
      { $set: { profile } },
      { new: true, upsert: false }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`Profile saved for ${clerkId}:`, profile);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Profile Save Error:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}