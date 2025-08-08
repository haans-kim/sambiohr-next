// 이상 패턴 감지 서비스 - 서버 사이드 구현
import { getDatabase } from '@/lib/db';
import { differenceInMinutes, format } from 'date-fns';

export type AnomalyType = 
  | 'TAILGATING'       // 꼬리물기
  | 'LONG_ABSENCE'     // 장시간 외출
  | 'NO_WORK'          // 업무 미수행 (O 태그 부재)
  | 'SHIFT_OVERLAP'    // 교대 겹침
  | 'MISSING_ENTRY'    // 출근 누락
  | 'MISSING_EXIT'     // 퇴근 누락
  | 'DUPLICATE_TAG'    // 중복 태그
  | 'ABNORMAL_HOURS';  // 비정상 시간

export interface Anomaly {
  id: string;
  employeeId: string;
  date: string;
  type: AnomalyType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  confidence: number;
  details?: any;
}

export interface AnomalyConfig {
  tailgatingThresholdSeconds: number;
  longAbsenceThresholdMinutes: number;
  noWorkThresholdHours: number;
  shiftOverlapMinutes: number;
}

export class AnomalyDetector {
  private config: AnomalyConfig = {
    tailgatingThresholdSeconds: 10,
    longAbsenceThresholdMinutes: 240, // 4시간
    noWorkThresholdHours: 8,
    shiftOverlapMinutes: 30
  };

  // 일일 이상 패턴 감지
  async detectDailyAnomalies(employeeId: string, date: string): Promise<Anomaly[]> {
    const db = getDatabase();
    const anomalies: Anomaly[] = [];
    
    // 해당 날짜의 태그 데이터 조회
    const tags = db.prepare(`
      SELECT * FROM tag_data 
      WHERE employee_id = ? AND date = ?
      ORDER BY timestamp
    `).all(employeeId, date) as any[];
    
    if (tags.length === 0) {
      return anomalies;
    }
    
    // 각 이상 패턴 감지
    anomalies.push(...this.detectTailgating(tags, employeeId, date));
    anomalies.push(...this.detectLongAbsence(tags, employeeId, date));
    anomalies.push(...this.detectNoWork(tags, employeeId, date));
    anomalies.push(...this.detectShiftOverlap(tags, employeeId, date));
    anomalies.push(...this.detectMissingTags(tags, employeeId, date));
    
    // 이상 패턴 저장
    this.saveAnomalies(anomalies);
    
    return anomalies;
  }
  
  // 꼬리물기 감지
  private detectTailgating(tags: any[], employeeId: string, date: string): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const threshold = this.config.tailgatingThresholdSeconds;
    
    // 게이트 태그 그룹화
    const gateTags = tags.filter(t => ['G1', 'G2', 'G3', 'G4'].includes(t.tag_code));
    
    for (let i = 1; i < gateTags.length; i++) {
      const prev = new Date(gateTags[i - 1].timestamp);
      const curr = new Date(gateTags[i].timestamp);
      const diffSeconds = (curr.getTime() - prev.getTime()) / 1000;
      
      if (diffSeconds <= threshold && gateTags[i - 1].tag_code === gateTags[i].tag_code) {
        anomalies.push({
          id: `tailgate_${Date.now()}_${i}`,
          employeeId,
          date,
          type: 'TAILGATING',
          severity: diffSeconds <= 5 ? 'HIGH' : 'MEDIUM',
          description: `${gateTags[i].tag_code} 게이트 꼬리물기 감지 (${diffSeconds}초 간격)`,
          startTime: prev,
          endTime: curr,
          duration: diffSeconds,
          confidence: 0.95,
          details: {
            gate: gateTags[i].tag_code,
            interval: diffSeconds
          }
        });
      }
    }
    
    return anomalies;
  }
  
  // 장시간 외출 감지
  private detectLongAbsence(tags: any[], employeeId: string, date: string): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const threshold = this.config.longAbsenceThresholdMinutes;
    
    // N1, N2 태그 연속 확인
    let absenceStart: Date | null = null;
    
    for (const tag of tags) {
      if (['N1', 'N2'].includes(tag.tag_code)) {
        if (!absenceStart) {
          absenceStart = new Date(tag.timestamp);
        }
      } else if (absenceStart) {
        const duration = differenceInMinutes(new Date(tag.timestamp), absenceStart);
        
        if (duration >= threshold) {
          anomalies.push({
            id: `absence_${Date.now()}`,
            employeeId,
            date,
            type: 'LONG_ABSENCE',
            severity: duration >= 360 ? 'HIGH' : 'MEDIUM',
            description: `장시간 외출 감지 (${Math.floor(duration / 60)}시간 ${duration % 60}분)`,
            startTime: absenceStart,
            endTime: new Date(tag.timestamp),
            duration,
            confidence: 0.85
          });
        }
        absenceStart = null;
      }
    }
    
    return anomalies;
  }
  
  // 업무 미수행 감지 (O 태그 부재)
  private detectNoWork(tags: any[], employeeId: string, date: string): Anomaly[] {
    const anomalies: Anomaly[] = [];
    const oTags = tags.filter(t => t.tag_code === 'O');
    
    if (oTags.length === 0) {
      anomalies.push({
        id: `nowork_${Date.now()}`,
        employeeId,
        date,
        type: 'NO_WORK',
        severity: 'CRITICAL',
        description: 'O 태그 완전 누락 - 업무 확인 불가',
        startTime: new Date(date),
        confidence: 0.98
      });
    } else {
      // O 태그 간격 확인
      for (let i = 1; i < oTags.length; i++) {
        const gap = differenceInMinutes(
          new Date(oTags[i].timestamp),
          new Date(oTags[i - 1].timestamp)
        );
        
        if (gap > this.config.noWorkThresholdHours * 60) {
          anomalies.push({
            id: `nowork_gap_${Date.now()}_${i}`,
            employeeId,
            date,
            type: 'NO_WORK',
            severity: 'HIGH',
            description: `${Math.floor(gap / 60)}시간 동안 O 태그 없음`,
            startTime: new Date(oTags[i - 1].timestamp),
            endTime: new Date(oTags[i].timestamp),
            duration: gap,
            confidence: 0.9
          });
        }
      }
    }
    
    return anomalies;
  }
  
  // 교대 겹침 감지
  private detectShiftOverlap(tags: any[], employeeId: string, date: string): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    // 20:00-20:30 사이 태그 확인
    const overlapTags = tags.filter(t => {
      const hour = new Date(t.timestamp).getHours();
      const minute = new Date(t.timestamp).getMinutes();
      return hour === 20 && minute <= 30;
    });
    
    // 같은 위치에 여러 사람 감지 로직 (추가 구현 필요)
    if (overlapTags.length > 0) {
      const g1Tags = overlapTags.filter(t => t.tag_code === 'G1');
      if (g1Tags.length >= 2) {
        anomalies.push({
          id: `overlap_${Date.now()}`,
          employeeId,
          date,
          type: 'SHIFT_OVERLAP',
          severity: 'MEDIUM',
          description: '교대 시간 겹침 가능성',
          startTime: new Date(overlapTags[0].timestamp),
          endTime: new Date(overlapTags[overlapTags.length - 1].timestamp),
          confidence: 0.7,
          details: {
            tags: g1Tags.map(t => t.tag_code)
          }
        });
      }
    }
    
    return anomalies;
  }
  
  // 출퇴근 태그 누락 감지
  private detectMissingTags(tags: any[], employeeId: string, date: string): Anomaly[] {
    const anomalies: Anomaly[] = [];
    
    const g1Tags = tags.filter(t => t.tag_code === 'G1');
    const firstTag = tags[0];
    const lastTag = tags[tags.length - 1];
    
    // 출근 태그 확인
    if (g1Tags.length === 0 || 
        (firstTag && new Date(firstTag.timestamp).getHours() > 10)) {
      anomalies.push({
        id: `missing_entry_${Date.now()}`,
        employeeId,
        date,
        type: 'MISSING_ENTRY',
        severity: 'HIGH',
        description: '출근 태그 누락',
        startTime: new Date(date),
        confidence: 0.85
      });
    }
    
    // 퇴근 태그 확인
    if (lastTag && lastTag.tag_code !== 'G1' && 
        new Date(lastTag.timestamp).getHours() >= 18) {
      anomalies.push({
        id: `missing_exit_${Date.now()}`,
        employeeId,
        date,
        type: 'MISSING_EXIT',
        severity: 'MEDIUM',
        description: '퇴근 태그 누락',
        startTime: new Date(lastTag.timestamp),
        confidence: 0.8
      });
    }
    
    return anomalies;
  }
  
  // 이상 패턴 저장
  private saveAnomalies(anomalies: Anomaly[]): void {
    if (anomalies.length === 0) return;
    
    const db = getDatabase();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO anomaly_patterns (
        id, employee_id, date, type, severity,
        description, start_time, end_time, duration,
        confidence, details
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const transaction = db.transaction(() => {
      for (const anomaly of anomalies) {
        stmt.run(
          anomaly.id,
          anomaly.employeeId,
          anomaly.date,
          anomaly.type,
          anomaly.severity,
          anomaly.description,
          anomaly.startTime.toISOString(),
          anomaly.endTime?.toISOString() || null,
          anomaly.duration || null,
          anomaly.confidence,
          JSON.stringify(anomaly.details || {})
        );
      }
    });
    
    transaction();
  }
  
  // 설정 업데이트
  updateConfig(config: Partial<AnomalyConfig>): void {
    this.config = { ...this.config, ...config };
  }
  
  getConfig(): AnomalyConfig {
    return { ...this.config };
  }
}

// 싱글톤 인스턴스
export const anomalyDetector = new AnomalyDetector();