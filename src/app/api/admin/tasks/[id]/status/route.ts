import { NextResponse } from 'next/server';
import { db } from '@/lib/tcb';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!db) {
    return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
  }

  try {
    const { id } = await params;
    const { status } = await request.json();

    await db.collection('orders').doc(id).update({
      status: status
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Update status failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
