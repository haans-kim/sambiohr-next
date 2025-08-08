'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, TrendingUp, Clock } from 'lucide-react';

interface OrganizationCardProps {
  center: string;
  team?: string;
  group?: string;
  totalEmployees: number;
  avgWorkTime: number;
  avgEstimationRate: number;
  performanceScore: number;
  onClick?: () => void;
}

export function OrganizationCard({
  center,
  team,
  group,
  totalEmployees,
  avgWorkTime,
  avgEstimationRate,
  performanceScore,
  onClick,
}: OrganizationCardProps) {
  const getPerformanceBadge = (score: number) => {
    if (score >= 90) return { variant: 'success' as const, label: '우수' };
    if (score >= 70) return { variant: 'info' as const, label: '양호' };
    if (score >= 50) return { variant: 'warning' as const, label: '보통' };
    return { variant: 'destructive' as const, label: '개선필요' };
  };

  const performance = getPerformanceBadge(performanceScore);

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              <span>{center}</span>
            </div>
          </CardTitle>
          <Badge variant={performance.variant}>{performance.label}</Badge>
        </div>
        {(team || group) && (
          <div className="text-sm text-gray-500 mt-1">
            {team && <span>{team}</span>}
            {team && group && <span> / </span>}
            {group && <span>{group}</span>}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">인원</p>
              <p className="text-sm font-semibold">{totalEmployees}명</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">평균 근무</p>
              <p className="text-sm font-semibold">{avgWorkTime.toFixed(1)}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">추정률</p>
              <p className="text-sm font-semibold">{avgEstimationRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">성과점수</p>
              <p className="text-sm font-semibold">{performanceScore.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}