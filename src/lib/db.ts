import { sql } from '@vercel/postgres';

export function getDb() {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    console.warn('DATABASE_URL or POSTGRES_URL environment variable is not set. Please link a Vercel Postgres database.');
  }
  return sql;
}

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(255) NOT NULL,
      score INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;
}
