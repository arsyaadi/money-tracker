

import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyTotal } from '@/lib/googleSheets';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  
  if (!month) {
    return NextResponse.json({ error: 'Missing month parameter' }, { status: 400 });
  }

  try {
    const data = await getMonthlyTotal(month);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
