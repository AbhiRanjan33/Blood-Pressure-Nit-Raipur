// src/app/api/google-fit-data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: 'Not authenticated', steps: 0, heartPoints: 0, calories: 0, distance: 0, moveMinutes: 0, speed: 0 },
      { status: 401 }
    );
  }

  const accessToken = session.accessToken;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();

  const startTimeMs = todayStart.getTime();
  const endTimeMs = todayEnd.getTime();

  try {
    const aggregateBody = (dataType: string, dataSourceId: string) => ({
      aggregateBy: [{ dataTypeName: dataType, dataSourceId }],
      bucketByTime: { durationMillis: 86400000 }, // 1 day
      startTimeMillis: startTimeMs,
      endTimeMillis: endTimeMs,
    });

    // 1. STEPS
    const stepsRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(aggregateBody('com.google.step_count.delta', 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps')),
    });
    let steps = 0;
    if (stepsRes.ok) {
      const data = await stepsRes.json();
      steps = data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0;
      console.log('🦶 STEPS:', steps, 'Raw Bucket:', JSON.stringify(data.bucket?.[0]));
    } else {
      console.error('Steps Error:', stepsRes.status);
    }

    // 2. HEART POINTS
    const heartRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(aggregateBody('com.google.heart_minutes', 'derived:com.google.heart_minutes:com.google.android.gms:merge_heart_minutes')),
    });
    let heartPoints = 0;
    if (heartRes.ok) {
      const data = await heartRes.json();
      heartPoints = Math.round(data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0);
      console.log('❤️ HEART POINTS:', heartPoints, 'Raw Bucket:', JSON.stringify(data.bucket?.[0]));
    }

    // 3. TOTAL CALORIES BURNED (Including BMR)
    const caloriesRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(aggregateBody('com.google.calories.expended', 'derived:com.google.calories.expended:com.google.android.gms:merge_calories_expended')
),
    });
    let calories = 0;
    if (caloriesRes.ok) {
      const data = await caloriesRes.json();
      calories = Math.round(data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0);
      console.log('🔥 TOTAL CALORIES:', calories, 'Raw Bucket:', JSON.stringify(data.bucket?.[0]));
    } else {
      console.error('Calories Error:', caloriesRes.status);
    }

    // 4. DISTANCE (KM) - Exact Value
    const distanceRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(aggregateBody('com.google.distance.delta', 'derived:com.google.distance.delta:com.google.android.gms:merge_distance_delta')),
    });
    let distance = 0;
    if (distanceRes.ok) {
      const data = await distanceRes.json();
      distance = (data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0) / 1000;
      console.log('🚶 DISTANCE (km):', distance, 'Raw Bucket:', JSON.stringify(data.bucket?.[0]));
    }

    // 5. MOVE MINUTES
    const moveRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(aggregateBody('com.google.active_minutes', 'derived:com.google.active_minutes:com.google.android.gms:merge_active_minutes')),
    });
    let moveMinutes = 0;
    if (moveRes.ok) {
      const data = await moveRes.json();
      moveMinutes = data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0;
      console.log('⏱️ MOVE MINUTES:', moveMinutes, 'Raw Bucket:', JSON.stringify(data.bucket?.[0]));
    }

    // 6. SPEED (Average km/h)
    const speedRes = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(aggregateBody('com.google.speed')),
    });
    let speed = 0;
    if (speedRes.ok) {
      const data = await speedRes.json();
      speed = Math.round((data.bucket?.[0]?.dataset?.[0]?.point?.[0]?.value?.[0]?.fpVal || 0) * 3.6 * 100) / 100; // m/s to km/h
      console.log('🏃 SPEED (km/h):', speed, 'Raw Bucket:', JSON.stringify(data.bucket?.[0]));
    }

    console.log('📊 ALL METRICS SUMMARY:', { steps, heartPoints, calories, distance, moveMinutes, speed });

    return NextResponse.json({
      steps,
      heartPoints,
      calories,
      distance,  // Exact 0.97
      moveMinutes,
      speed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Google Fit API Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch',
      steps: 0,
      heartPoints: 0,
      calories: 0,
      distance: 0,
      moveMinutes: 0,
      speed: 0,
    }, { status: 500 });
  }
}