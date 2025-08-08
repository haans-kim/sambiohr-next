import { NextRequest, NextResponse } from 'next/server';
import { anomalyDetector } from '@/lib/services/anomalyDetector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId, date } = body;
    
    if (!employeeId || !date) {
      return NextResponse.json(
        { success: false, error: 'employeeId and date are required' },
        { status: 400 }
      );
    }
    
    // 이상 패턴 감지 실행
    const anomalies = await anomalyDetector.detectDailyAnomalies(employeeId, date);
    
    return NextResponse.json({
      success: true,
      data: {
        employeeId,
        date,
        anomalies,
        summary: {
          total: anomalies.length,
          critical: anomalies.filter(a => a.severity === 'CRITICAL').length,
          high: anomalies.filter(a => a.severity === 'HIGH').length,
          medium: anomalies.filter(a => a.severity === 'MEDIUM').length,
          low: anomalies.filter(a => a.severity === 'LOW').length
        }
      }
    });
  } catch (error) {
    console.error('Error detecting anomalies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to detect anomalies' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const employeeId = searchParams.get('employeeId');
    const date = searchParams.get('date');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    
    // 이상 패턴 조회 로직
    const { getDatabase } = await import('@/lib/db');
    const db = getDatabase();
    
    let query = 'SELECT * FROM anomaly_patterns WHERE 1=1';
    const params: any[] = [];
    
    if (employeeId) {
      query += ' AND employee_id = ?';
      params.push(employeeId);
    }
    
    if (date) {
      query += ' AND date = ?';
      params.push(date);
    }
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }
    
    query += ' ORDER BY date DESC, start_time DESC LIMIT 100';
    
    const anomalies = db.prepare(query).all(...params);
    
    return NextResponse.json({
      success: true,
      data: anomalies
    });
  } catch (error) {
    console.error('Error fetching anomalies:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch anomalies' },
      { status: 500 }
    );
  }
}