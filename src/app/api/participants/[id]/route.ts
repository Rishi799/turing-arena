import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export async function PUT(request: Request, ctx: RouteContext<'/api/participants/[id]'>) {
  try {
    const authHeader = request.headers.get('cookie');
    if (!authHeader || !authHeader.includes('admin_token=authenticated')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await ctx.params;
    const { name, phone, score } = await request.json();

    if (!name || !phone || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await initDb();
    const parsedScore = Number(score);

    const sql = getDb();
    const result = await sql`
      UPDATE participants 
      SET name = ${name}, phone = ${phone}, score = ${parsedScore} 
      WHERE id = ${id}
      RETURNING *
    `;

    const rows = result.rows;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 });
  }
}

export async function DELETE(request: Request, ctx: RouteContext<'/api/participants/[id]'>) {
  try {
    const authHeader = request.headers.get('cookie');
    if (!authHeader || !authHeader.includes('admin_token=authenticated')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await ctx.params;
    await initDb();
    const sql = getDb();
    await sql`DELETE FROM participants WHERE id = ${id}`;

    return NextResponse.json({ message: 'Participant deleted' });
  } catch (error) {
    console.error('Error deleting participant:', error);
    return NextResponse.json({ error: 'Failed to delete participant' }, { status: 500 });
  }
}
