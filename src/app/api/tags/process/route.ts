import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { TagProcessor } from '@/lib/services/tagProcessor';

export async function POST(request: NextRequest) {
  try {
    const db = getDatabase();
    const body = await request.json();
    const { employeeId, date, tags } = body;
    
    if (!employeeId || !date || !Array.isArray(tags)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }
    
    const processor = new TagProcessor();
    
    // 태그 시퀀스 처리
    const tagData = tags.map(t => ({
      code: t.code,
      timestamp: new Date(t.timestamp)
    }));
    
    const activityState = processor.processTagSequence(tagData);
    const anomalies = processor.detectAnomalies(tagData);
    
    // 데이터베이스에 저장
    const insertStmt = db.prepare(`
      INSERT INTO tag_data (employee_id, tag_code, timestamp, date, activity_state, reliability_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = db.transaction(() => {
      for (const tag of tags) {
        insertStmt.run(
          employeeId,
          tag.code,
          tag.timestamp,
          date,
          activityState,
          tag.reliability || 1.0
        );
      }
    });
    
    transaction();
    
    // 일일 집계 업데이트
    updateDailySummary(db, employeeId, date);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        activityState,
        anomalies,
        tagsProcessed: tags.length
      }
    });
  } catch (error) {
    console.error('Error processing tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process tags' },
      { status: 500 }
    );
  }
}

function updateDailySummary(db: any, employeeId: string, date: string) {
  // 해당 날짜의 태그 데이터 조회
  const tagData = db.prepare(`
    SELECT activity_state, 
           COUNT(*) as count,
           MIN(timestamp) as start_time,
           MAX(timestamp) as end_time
    FROM tag_data
    WHERE employee_id = ? AND date = ?
    GROUP BY activity_state
  `).all(employeeId, date);
  
  // 시간 계산
  let workTime = 0;
  let meetingTime = 0;
  let mealTime = 0;
  let restTime = 0;
  let movementTime = 0;
  
  for (const data of tagData as any[]) {
    const duration = (new Date(data.end_time).getTime() - new Date(data.start_time).getTime()) / (1000 * 60 * 60);
    
    switch (data.activity_state) {
      case '업무':
        workTime += duration;
        break;
      case '회의':
        meetingTime += duration;
        break;
      case '식사':
        mealTime += duration;
        break;
      case '휴식':
        restTime += duration;
        break;
      case '이동':
        movementTime += duration;
        break;
    }
  }
  
  // 일일 집계 업데이트
  const upsertStmt = db.prepare(`
    INSERT INTO daily_summary (
      employee_id, date, attendance_time, work_time, meeting_time, 
      meal_time, rest_time, movement_time, estimation_rate, reliability_score
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(employee_id, date) DO UPDATE SET
      attendance_time = excluded.attendance_time,
      work_time = excluded.work_time,
      meeting_time = excluded.meeting_time,
      meal_time = excluded.meal_time,
      rest_time = excluded.rest_time,
      movement_time = excluded.movement_time,
      estimation_rate = excluded.estimation_rate,
      reliability_score = excluded.reliability_score,
      updated_at = CURRENT_TIMESTAMP
  `);
  
  const totalTime = workTime + meetingTime + mealTime + restTime + movementTime;
  const estimationRate = totalTime > 0 ? (workTime / totalTime) * 100 : 0;
  
  upsertStmt.run(
    employeeId,
    date,
    totalTime,
    workTime,
    meetingTime,
    mealTime,
    restTime,
    movementTime,
    estimationRate,
    0.95 // 기본 신뢰도
  );
}