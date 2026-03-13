import { NextRequest, NextResponse } from 'next/server';
import { deleteIncome } from '@/lib/googleSheets';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteIncome(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/incomes/[id] error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}