import { NextRequest, NextResponse } from 'next/server';
import { getCategories, addCategory } from '@/lib/googleSheets';

export async function GET(request: NextRequest) {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (error) {
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

    const category = await addCategory({
      name,
      icon: icon || '📌',
      color: color || '#000000',
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
