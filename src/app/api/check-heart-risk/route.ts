// src/app/api/check-heart-risk/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch('https://bp-proba-api.onrender.com/predict_heart_risk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Render API Error:', error);
      return NextResponse.json({ error: 'External API failed' }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Proxy Error:', err);
    return NextResponse.json({ error: 'Failed to reach API' }, { status: 500 });
  }
}