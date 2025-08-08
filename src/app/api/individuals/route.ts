import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const db = getDatabase();
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const employeeId = searchParams.get('employeeId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT i.*, o.center, o.team, o.group_name 
      FROM individuals i
      LEFT JOIN organizations o ON i.organization_id = o.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    if (organizationId) {
      query += ' AND i.organization_id = ?';
      params.push(parseInt(organizationId));
    }
    
    if (employeeId) {
      query += ' AND i.employee_id = ?';
      params.push(employeeId);
    }
    
    // 전체 개수 조회
    const countQuery = query.replace('SELECT i.*, o.center, o.team, o.group_name', 'SELECT COUNT(*) as total');
    const totalResult = db.prepare(countQuery).get(...params) as any;
    const total = totalResult.total;
    
    // 페이지네이션 적용
    query += ' ORDER BY i.employee_id LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const individuals = db.prepare(query).all(...params);
    
    return NextResponse.json({ 
      success: true, 
      data: individuals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching individuals:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch individuals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    const { employee_id, name, organization_id, work_type, shift_type } = body;
    
    const stmt = db.prepare(`
      INSERT INTO individuals (employee_id, name, organization_id, work_type, shift_type)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(employee_id, name, organization_id, work_type, shift_type);
    
    return NextResponse.json({ 
      success: true, 
      data: { id: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Error creating individual:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create individual' },
      { status: 500 }
    );
  }
}