import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDb(); // Ensure table exists
    const sql = getDb();
    const participants = await sql`SELECT * FROM participants ORDER BY score DESC, created_at ASC`;
    return NextResponse.json(participants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('cookie');
    if (!authHeader || !authHeader.includes('admin_token=authenticated')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, score } = await request.json();

    if (!name || !phone || score === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const sql = getDb();
    const result = await sql`
      INSERT INTO participants (name, phone, score) 
      VALUES (${name}, ${phone}, ${parseInt(score, 10)})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: 'Failed to add participant' }, { status: 500 });
  }
}
