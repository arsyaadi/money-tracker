

import { NextRequest, NextResponse } from 'next/server';
import { deleteExpense } from '@/lib/googleSheets';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteExpense(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/expenses/[id] error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
