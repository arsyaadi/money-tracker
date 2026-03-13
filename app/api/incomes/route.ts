import { NextRequest, NextResponse } from 'next/server';
import { addIncome, getIncomes, INCOME_CATEGORIES } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || undefined;
  const category = searchParams.get('category') || undefined;
  try {
    const incomes = await getIncomes(month, category);
    return NextResponse.json({ incomes });
  } catch (error) {
    console.error('GET /api/incomes error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { date, amount, category, title } = body;

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing date' }, { status: 400 });
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
    }

    const income = await addIncome({
      date,
      amount,
      category,
      title: title ?? '',
    });

    return NextResponse.json({ income }, { status: 201 });
  } catch (error) {
    console.error('POST /api/incomes error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}