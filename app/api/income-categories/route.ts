import { NextRequest, NextResponse } from 'next/server';
import { getIncomeCategories, addIncomeCategory } from '@/lib/googleSheets';

export async function GET() {
  try {
    const categories = await getIncomeCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('GET /api/income-categories error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, color } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing name' }, { status: 400 });
    }

    const category = await addIncomeCategory({
      name,
      icon: icon || '💰',
      color: color || '#6b7280',
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('POST /api/income-categories error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}