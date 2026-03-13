import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyIncomeTotal } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  if (!month) {
    return NextResponse.json(
      { error: 'Missing month parameter' },
      { status: 400 }
    );
  }

  try {
    const data = await getMonthlyIncomeTotal(month);
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/incomes/monthly-total error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}