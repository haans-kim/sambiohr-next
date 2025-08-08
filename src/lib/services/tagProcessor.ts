// 태그 처리 엔진
export const TAG_CODES = {
  GATE: ['G1', 'G2', 'G3', 'G4'],
  TRANSIT: ['T1', 'T2', 'T3'],
  NON_WORK: ['N1', 'N2'],
  MEAL: ['M1', 'M2'],
  WORK: ['O']
} as const;

export const ACTIVITY_STATES = {
  WORK: '업무',
  PREPARATION: '준비',
  MEETING: '회의',
  MEAL: '식사',
  REST: '휴식',
  MOVEMENT: '이동',
  ABSENCE: '부재',
  OFF_WORK: '퇴근',
  UNKNOWN: '미분류',
  HANDOVER: '인수인계',
  LONG_ABSENCE: '장기외출'
} as const;

export interface TagTransition {
  from: string;
  to: string;
  probability: number;
  timeContext?: 'meal' | 'shift_change' | 'normal';
}

export class TagProcessor {
  private transitionMatrix: Map<string, Map<string, number>>;
  
  constructor() {
    this.transitionMatrix = this.initializeTransitionMatrix();
  }
  
  private initializeTransitionMatrix(): Map<string, Map<string, number>> {
    const matrix = new Map<string, Map<string, number>>();
    
    // G1 태그 전환 확률
    const g1Transitions = new Map<string, number>();
    g1Transitions.set('O', 0.98); // O 태그가 있으면 98% 업무
    g1Transitions.set('G2', 0.3);  // G2로 전환시 30% 회의
    g1Transitions.set('G3', 0.2);  // G3로 전환시 20% 이동
    g1Transitions.set('M1', 0.95); // M1로 전환시 95% 식사
    g1Transitions.set('M2', 0.95); // M2로 전환시 95% 식사
    matrix.set('G1', g1Transitions);
    
    // 추가 전환 규칙들...
    
    return matrix;
  }
  
  processTagSequence(tags: Array<{code: string, timestamp: Date}>): string {
    if (tags.length === 0) return ACTIVITY_STATES.UNKNOWN;
    
    // O 태그 우선 처리
    if (tags.some(t => t.code === 'O')) {
      return ACTIVITY_STATES.WORK;
    }
    
    // 식사 태그 처리
    if (tags.some(t => TAG_CODES.MEAL.includes(t.code as any))) {
      return ACTIVITY_STATES.MEAL;
    }
    
    // 전환 확률 기반 처리
    let currentState = ACTIVITY_STATES.UNKNOWN;
    for (let i = 1; i < tags.length; i++) {
      const fromTag = tags[i - 1].code;
      const toTag = tags[i].code;
      
      const transitions = this.transitionMatrix.get(fromTag);
      if (transitions?.has(toTag)) {
        const probability = transitions.get(toTag)!;
        if (probability > 0.5) {
          currentState = this.determineStateFromTransition(fromTag, toTag);
        }
      }
    }
    
    return currentState;
  }
  
  private determineStateFromTransition(from: string, to: string): string {
    // 전환 패턴별 상태 결정 로직
    if (from === 'G1' && to === 'O') return ACTIVITY_STATES.WORK;
    if (from === 'G1' && to === 'G2') return ACTIVITY_STATES.MEETING;
    if (TAG_CODES.MEAL.includes(to as any)) return ACTIVITY_STATES.MEAL;
    
    return ACTIVITY_STATES.UNKNOWN;
  }
  
  detectAnomalies(tags: Array<{code: string, timestamp: Date}>): string[] {
    const anomalies: string[] = [];
    
    // 꼬리물기 감지 (교대 시간 겹침)
    const shiftOverlap = this.detectShiftOverlap(tags);
    if (shiftOverlap) anomalies.push('SHIFT_OVERLAP');
    
    // 장기 외출 감지 (4시간 이상 N 태그)
    const longAbsence = this.detectLongAbsence(tags);
    if (longAbsence) anomalies.push('LONG_ABSENCE');
    
    // 업무 미수행 감지 (하루 종일 O 태그 없음)
    const noWork = this.detectNoWork(tags);
    if (noWork) anomalies.push('NO_WORK');
    
    return anomalies;
  }
  
  private detectShiftOverlap(tags: Array<{code: string, timestamp: Date}>): boolean {
    // 20:00-20:30 사이 중복 체크
    const overlapStart = new Date();
    overlapStart.setHours(20, 0, 0, 0);
    const overlapEnd = new Date();
    overlapEnd.setHours(20, 30, 0, 0);
    
    const overlapTags = tags.filter(t => 
      t.timestamp >= overlapStart && t.timestamp <= overlapEnd
    );
    
    // 같은 위치에 2명 이상 감지 로직
    return overlapTags.length > 1 && overlapTags.some(t => t.code === 'G1');
  }
  
  private detectLongAbsence(tags: Array<{code: string, timestamp: Date}>): boolean {
    let absenceStart: Date | null = null;
    
    for (const tag of tags) {
      if (TAG_CODES.NON_WORK.includes(tag.code as any)) {
        if (!absenceStart) {
          absenceStart = tag.timestamp;
        }
      } else {
        if (absenceStart) {
          const duration = (tag.timestamp.getTime() - absenceStart.getTime()) / (1000 * 60 * 60);
          if (duration >= 4) return true;
          absenceStart = null;
        }
      }
    }
    
    return false;
  }
  
  private detectNoWork(tags: Array<{code: string, timestamp: Date}>): boolean {
    return !tags.some(t => t.code === 'O');
  }
}