import { NextRequest, NextResponse } from 'next/server';
import { getAssets, addAsset, updateAsset, deleteAsset } from '@/lib/googleSheets';

export async function GET() {
  try {
    const assets = await getAssets();
    return NextResponse.json({ assets });
  } catch (error) {
    console.error('GET /api/assets error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, amount, icon } = body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json({ error: 'Amount must be a valid number' }, { status: 400 });
    }

    const asset = await addAsset({
      name: name.trim(),
      amount,
      icon: icon || '💎',
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error('POST /api/assets error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, amount, icon } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (typeof amount !== 'number' || isNaN(amount)) {
      return NextResponse.json({ error: 'Amount must be a valid number' }, { status: 400 });
    }

    const asset = await updateAsset({
      id,
      name: name.trim(),
      amount,
      icon: icon || '💎',
    });

    return NextResponse.json({ asset });
  } catch (error) {
    console.error('PUT /api/assets error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
    }

    await deleteAsset(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/assets error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}