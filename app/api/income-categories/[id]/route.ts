import { NextRequest, NextResponse } from 'next/server';
import { deleteIncomeCategory } from '@/lib/googleSheets';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteIncomeCategory(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/income-categories/[id] error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}