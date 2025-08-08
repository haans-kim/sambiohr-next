// 전환 확률 매트릭스 - 서버 사이드 구현
import { TAG_CODES, ACTIVITY_STATES } from './tagProcessor';

export type TagCode = keyof typeof TAG_CODES | 'G1' | 'G2' | 'G3' | 'G4' | 'T1' | 'T2' | 'T3' | 'N1' | 'N2' | 'M1' | 'M2' | 'O';
export type ActivityState = typeof ACTIVITY_STATES[keyof typeof ACTIVITY_STATES];

export interface TransitionProbability {
  fromTag: TagCode;
  toTag: TagCode;
  state: ActivityState;
  probability: number;
  timeWeight?: number;
}

// 기본 전환 확률 매트릭스
export const DEFAULT_TRANSITION_MATRIX: TransitionProbability[] = [
  // G1 -> O: 출근 후 사무실 = WORK
  { fromTag: 'G1', toTag: 'O', state: ACTIVITY_STATES.WORK, probability: 0.95 },
  
  // G1 -> T1: 출근 후 식당 = MEAL
  { fromTag: 'G1', toTag: 'T1', state: ACTIVITY_STATES.MEAL, probability: 0.85 },
  
  // G1 -> N1: 출근 후 복도 = MOVEMENT
  { fromTag: 'G1', toTag: 'N1', state: ACTIVITY_STATES.MOVEMENT, probability: 0.7 },
  
  // O -> T1: 사무실에서 식당 = MEAL
  { fromTag: 'O', toTag: 'T1', state: ACTIVITY_STATES.MEAL, probability: 0.9 },
  
  // O -> T2: 사무실에서 화장실 = REST
  { fromTag: 'O', toTag: 'T2', state: ACTIVITY_STATES.REST, probability: 0.8 },
  
  // O -> M1/M2: 사무실에서 회의실 = MEETING
  { fromTag: 'O', toTag: 'M1', state: ACTIVITY_STATES.MEETING, probability: 0.95 },
  { fromTag: 'O', toTag: 'M2', state: ACTIVITY_STATES.MEETING, probability: 0.95 },
  
  // T1 -> O: 식당에서 사무실 = WORK
  { fromTag: 'T1', toTag: 'O', state: ACTIVITY_STATES.WORK, probability: 0.85 },
  
  // M1/M2 -> O: 회의실에서 사무실 = WORK
  { fromTag: 'M1', toTag: 'O', state: ACTIVITY_STATES.WORK, probability: 0.9 },
  { fromTag: 'M2', toTag: 'O', state: ACTIVITY_STATES.WORK, probability: 0.9 },
  
  // O -> G1: 사무실에서 퇴근 = OFF_WORK
  { fromTag: 'O', toTag: 'G1', state: ACTIVITY_STATES.OFF_WORK, probability: 0.95 },
  
  // N2 -> O: 휴게실에서 사무실 = WORK
  { fromTag: 'N2', toTag: 'O', state: ACTIVITY_STATES.WORK, probability: 0.75 },
  
  // 기본 전환 (낮은 확률)
  { fromTag: 'N1', toTag: 'N1', state: ACTIVITY_STATES.MOVEMENT, probability: 0.5 },
  { fromTag: 'N1', toTag: 'N2', state: ACTIVITY_STATES.REST, probability: 0.6 }
];

// 시간대별 가중치
export interface TimeWeight {
  startHour: number;
  endHour: number;
  tagCode: TagCode;
  weight: number;
}

export const TIME_WEIGHTS: TimeWeight[] = [
  // 아침 식사 시간 (06:30-09:00)
  { startHour: 6.5, endHour: 9, tagCode: 'T1', weight: 1.5 },
  
  // 점심 시간 (11:20-13:20)
  { startHour: 11.33, endHour: 13.33, tagCode: 'T1', weight: 1.8 },
  
  // 저녁 시간 (17:00-20:00)
  { startHour: 17, endHour: 20, tagCode: 'T1', weight: 1.6 },
  
  // 야식 시간 (23:30-01:00)
  { startHour: 23.5, endHour: 1, tagCode: 'T1', weight: 1.7 },
  
  // 출근 시간대 (07:30-08:30)
  { startHour: 7.5, endHour: 8.5, tagCode: 'G1', weight: 1.5 },
  
  // 퇴근 시간대 (20:00-21:00, 08:00-09:00)
  { startHour: 20, endHour: 21, tagCode: 'G1', weight: 1.3 },
  { startHour: 8, endHour: 9, tagCode: 'G1', weight: 1.3 }
];

// 전환 확률 계산
export function calculateTransitionProbability(
  fromTag: TagCode,
  toTag: TagCode,
  timestamp: Date,
  customMatrix?: TransitionProbability[]
): { state: ActivityState; probability: number } {
  const matrix = customMatrix || DEFAULT_TRANSITION_MATRIX;
  
  // 해당 전환 찾기
  const transitions = matrix.filter(
    t => t.fromTag === fromTag && t.toTag === toTag
  );
  
  if (transitions.length === 0) {
    return { state: ACTIVITY_STATES.UNKNOWN, probability: 0 };
  }
  
  // 시간대 가중치 적용
  const hour = timestamp.getHours() + timestamp.getMinutes() / 60;
  let bestTransition = transitions[0];
  let maxProbability = 0;
  
  for (const transition of transitions) {
    let probability = transition.probability;
    
    // 시간대 가중치 확인
    const timeWeight = TIME_WEIGHTS.find(
      w => w.tagCode === toTag &&
      ((w.startHour <= w.endHour && hour >= w.startHour && hour <= w.endHour) ||
       (w.startHour > w.endHour && (hour >= w.startHour || hour <= w.endHour)))
    );
    
    if (timeWeight) {
      probability *= timeWeight.weight;
    }
    
    if (probability > maxProbability) {
      maxProbability = probability;
      bestTransition = transition;
    }
  }
  
  return {
    state: bestTransition.state,
    probability: Math.min(maxProbability, 1.0)
  };
}

// O 태그 특별 처리
export function processOTag(
  tagSequence: Array<{ code: TagCode; timestamp: Date }>,
  currentIndex: number
): ActivityState {
  const current = tagSequence[currentIndex];
  
  if (current.code !== 'O') {
    return ACTIVITY_STATES.UNKNOWN;
  }
  
  // O 태그는 거의 항상 WORK 상태
  const prev = currentIndex > 0 ? tagSequence[currentIndex - 1] : null;
  const next = currentIndex < tagSequence.length - 1 ? tagSequence[currentIndex + 1] : null;
  
  // 회의실에서 온 경우
  if (prev && (prev.code === 'M1' || prev.code === 'M2')) {
    const timeDiff = (current.timestamp.getTime() - prev.timestamp.getTime()) / 1000 / 60;
    if (timeDiff < 5) {
      return ACTIVITY_STATES.MEETING; // 회의 연속
    }
  }
  
  // 곧 퇴근하는 경우
  if (next && next.code === 'G1') {
    const timeDiff = (next.timestamp.getTime() - current.timestamp.getTime()) / 1000 / 60;
    if (timeDiff < 10) {
      return ACTIVITY_STATES.PREPARATION; // 퇴근 준비
    }
  }
  
  // 기본적으로 업무 상태
  return ACTIVITY_STATES.WORK;
}

// G1 모호성 해결
export function resolveG1Ambiguity(
  tagSequence: Array<{ code: TagCode; timestamp: Date }>,
  currentIndex: number
): ActivityState {
  const current = tagSequence[currentIndex];
  
  if (current.code !== 'G1') {
    return ACTIVITY_STATES.UNKNOWN;
  }
  
  const prev = currentIndex > 0 ? tagSequence[currentIndex - 1] : null;
  const next = currentIndex < tagSequence.length - 1 ? tagSequence[currentIndex + 1] : null;
  
  // 이전 태그가 없거나 장시간 차이 = 출근
  if (!prev || (current.timestamp.getTime() - prev.timestamp.getTime()) / 1000 / 60 > 60) {
    return ACTIVITY_STATES.WORK; // 출근 후 업무
  }
  
  // 다음 태그가 없거나 장시간 차이 = 퇴근
  if (!next || (next.timestamp.getTime() - current.timestamp.getTime()) / 1000 / 60 > 60) {
    return ACTIVITY_STATES.OFF_WORK;
  }
  
  // O 태그 근처 확인
  if (prev.code === 'O') {
    return ACTIVITY_STATES.OFF_WORK;
  }
  if (next.code === 'O') {
    return ACTIVITY_STATES.WORK;
  }
  
  // 시간대로 판단
  const hour = current.timestamp.getHours();
  if (hour >= 6 && hour <= 10) {
    return ACTIVITY_STATES.WORK;
  }
  if (hour >= 18 || hour <= 2) {
    return ACTIVITY_STATES.OFF_WORK;
  }
  
  return ACTIVITY_STATES.MOVEMENT;
}