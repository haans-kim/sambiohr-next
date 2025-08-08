'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parse, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TagEvent {
  id: number;
  tag_code: string;
  timestamp: string;
  activity_state?: string;
}

interface GanttChartProps {
  date: string;
  events: TagEvent[];
  shiftType?: 'DAY' | 'NIGHT';
}

const TAG_COLORS: Record<string, string> = {
  G1: '#3B82F6', // Blue
  G2: '#10B981', // Green
  G3: '#F59E0B', // Yellow
  G4: '#EF4444', // Red
  T1: '#8B5CF6', // Purple
  T2: '#EC4899', // Pink
  T3: '#06B6D4', // Cyan
  N1: '#64748B', // Slate
  N2: '#6B7280', // Gray
  M1: '#84CC16', // Lime
  M2: '#22C55E', // Green
  O: '#F97316', // Orange
};

const ACTIVITY_COLORS: Record<string, string> = {
  WORK: '#10B981',
  MEETING: '#3B82F6',
  MEAL: '#F59E0B',
  REST: '#8B5CF6',
  TRANSIT: '#EC4899',
  NON_WORK: '#6B7280',
  UNKNOWN: '#E5E5E5',
};

export function GanttChart({ date, events, shiftType = 'DAY' }: GanttChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredEvent, setHoveredEvent] = useState<TagEvent | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 시프트에 따른 시간 범위 설정
  const getTimeRange = () => {
    if (shiftType === 'NIGHT') {
      const baseDate = parse(date, 'yyyy-MM-dd', new Date());
      const prevDate = new Date(baseDate);
      prevDate.setDate(prevDate.getDate() - 1);
      prevDate.setHours(20, 0, 0, 0); // 전날 20:00
      
      const endDate = new Date(baseDate);
      endDate.setHours(8, 30, 0, 0); // 당일 08:30
      
      return { start: prevDate, end: endDate };
    } else {
      const baseDate = parse(date, 'yyyy-MM-dd', new Date());
      const startDate = new Date(baseDate);
      startDate.setHours(8, 0, 0, 0); // 08:00
      
      const endDate = new Date(baseDate);
      endDate.setHours(20, 30, 0, 0); // 20:30
      
      return { start: startDate, end: endDate };
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas 크기 설정
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = 400;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { start: startTime, end: endTime } = getTimeRange();
    const totalDuration = endTime.getTime() - startTime.getTime();
    const padding = { top: 40, right: 20, bottom: 40, left: 80 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;

    // 시간 축 그리기
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, canvas.height - padding.bottom);
    ctx.lineTo(canvas.width - padding.right, canvas.height - padding.bottom);
    ctx.stroke();

    // 시간 라벨 그리기
    ctx.fillStyle = '#6B7280';
    ctx.font = '12px sans-serif';
    
    const hours = Math.ceil(totalDuration / (1000 * 60 * 60));
    for (let i = 0; i <= hours; i++) {
      const time = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const x = padding.left + (i / hours) * chartWidth;
      
      // 시간 그리드 라인
      ctx.strokeStyle = '#F3F4F6';
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, canvas.height - padding.bottom);
      ctx.stroke();
      
      // 시간 라벨
      ctx.fillStyle = '#6B7280';
      ctx.textAlign = 'center';
      ctx.fillText(format(time, 'HH:mm'), x, canvas.height - padding.bottom + 20);
    }

    // 태그별로 이벤트 그룹화
    const tagGroups = events.reduce((acc, event) => {
      const tag = event.tag_code;
      if (!acc[tag]) acc[tag] = [];
      acc[tag].push(event);
      return acc;
    }, {} as Record<string, TagEvent[]>);

    // 각 태그 그룹 그리기
    const tagCodes = Object.keys(tagGroups);
    const rowHeight = chartHeight / Math.max(tagCodes.length, 1);

    tagCodes.forEach((tag, index) => {
      const y = padding.top + index * rowHeight + rowHeight / 2;
      
      // 태그 라벨
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(tag, padding.left - 10, y + 4);

      // 이벤트 그리기
      const events = tagGroups[tag];
      events.forEach((event, eventIndex) => {
        const eventTime = new Date(event.timestamp);
        const x = padding.left + ((eventTime.getTime() - startTime.getTime()) / totalDuration) * chartWidth;
        
        // 이벤트 바 그리기
        const nextEvent = events[eventIndex + 1];
        const endX = nextEvent
          ? padding.left + ((new Date(nextEvent.timestamp).getTime() - startTime.getTime()) / totalDuration) * chartWidth
          : x + 20; // 기본 너비

        const barHeight = rowHeight * 0.6;
        const barY = y - barHeight / 2;

        // 활동 상태에 따른 색상
        ctx.fillStyle = event.activity_state 
          ? ACTIVITY_COLORS[event.activity_state] || ACTIVITY_COLORS.UNKNOWN
          : TAG_COLORS[tag] || '#9CA3AF';
        
        ctx.fillRect(x, barY, endX - x, barHeight);

        // 이벤트 경계선
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.strokeRect(x, barY, endX - x, barHeight);
      });
    });

    // 범례 그리기
    const legendY = 10;
    const legendItems = [
      { label: '업무', color: ACTIVITY_COLORS.WORK },
      { label: '회의', color: ACTIVITY_COLORS.MEETING },
      { label: '식사', color: ACTIVITY_COLORS.MEAL },
      { label: '휴식', color: ACTIVITY_COLORS.REST },
      { label: '이동', color: ACTIVITY_COLORS.TRANSIT },
    ];

    let legendX = canvas.width - padding.right;
    legendItems.reverse().forEach((item) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX - 60, legendY, 12, 12);
      
      ctx.fillStyle = '#374151';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, legendX - 45, legendY + 10);
      
      legendX -= 70;
    });

  }, [date, events, shiftType]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x: e.clientX, y: e.clientY });

    // 호버된 이벤트 찾기 (간단한 구현)
    // 실제로는 더 정교한 히트 테스트가 필요함
    const { start: startTime } = getTimeRange();
    const padding = { left: 80, right: 20 };
    
    if (x >= padding.left && x <= canvas.width - padding.right) {
      // 마우스 위치에 해당하는 이벤트 찾기
      // ... 히트 테스트 로직
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>활동 타임라인</CardTitle>
          <Badge variant={shiftType === 'NIGHT' ? 'secondary' : 'default'}>
            {shiftType === 'NIGHT' ? '야간' : '주간'} 근무
          </Badge>
        </div>
        <p className="text-sm text-gray-500">
          {format(parse(date, 'yyyy-MM-dd', new Date()), 'PPP', { locale: ko })}
        </p>
      </CardHeader>
      <CardContent>
        <div ref={containerRef} className="relative w-full">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredEvent(null)}
          />
          
          {hoveredEvent && (
            <div
              className="absolute z-10 bg-white border rounded-lg shadow-lg p-3 pointer-events-none"
              style={{
                left: `${mousePos.x + 10}px`,
                top: `${mousePos.y - 50}px`,
              }}
            >
              <div className="text-sm">
                <p className="font-semibold">{hoveredEvent.tag_code}</p>
                <p className="text-gray-600">
                  {format(new Date(hoveredEvent.timestamp), 'HH:mm:ss')}
                </p>
                {hoveredEvent.activity_state && (
                  <Badge className="mt-1" variant="outline">
                    {hoveredEvent.activity_state}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}