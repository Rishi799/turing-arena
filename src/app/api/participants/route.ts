import { NextResponse } from 'next/server';
import { getDb, initDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const gameFilter = url.searchParams.get('game');
    
    await initDb(); // Ensure table exists
    const sql = getDb();
    
    let participants;
    if (gameFilter) {
      participants = await sql`SELECT * FROM participants WHERE game = ${gameFilter} ORDER BY score DESC, created_at ASC`;
    } else {
      participants = await sql`SELECT * FROM participants ORDER BY score DESC, created_at ASC`;
    }
    
    return NextResponse.json(participants.rows || participants);
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

    const { name, phone, score, game } = await request.json();

    if (!name || !phone || score === undefined || !game) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await initDb(); // Ensure table exists on Vercel deployments
    const parsedScore = Number(score);

    const sql = getDb();
    const result = await sql`
      INSERT INTO participants (name, phone, score, game) 
      VALUES (${name}, ${phone}, ${parsedScore}, ${game})
      RETURNING *
    `;

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: error.message || 'Failed to add participant' }, { status: 500 });
  }
}
