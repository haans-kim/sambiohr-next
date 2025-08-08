import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const searchParams = request.nextUrl.searchParams;
    const level = searchParams.get('level');
    const parentId = searchParams.get('parentId');
    
    let query = 'SELECT * FROM organizations WHERE 1=1';
    const params: any[] = [];
    
    if (level) {
      query += ' AND level = ?';
      params.push(parseInt(level));
    }
    
    if (parentId) {
      query += ' AND parent_id = ?';
      params.push(parseInt(parentId));
    }
    
    query += ' ORDER BY center, team, group_name';
    
    const organizations = db.prepare(query).all(...params);
    
    return NextResponse.json({ 
      success: true, 
      data: organizations 
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    const { center, team, group_name, level, parent_id } = body;
    
    const stmt = db.prepare(`
      INSERT INTO organizations (center, team, group_name, level, parent_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(center, team, group_name, level, parent_id);
    
    return NextResponse.json({ 
      success: true, 
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}