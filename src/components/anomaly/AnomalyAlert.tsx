'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Info, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AnomalyAlertProps {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  startTime: string;
  endTime?: string;
  employeeId?: string;
  confidence?: number;
}

export function AnomalyAlert({
  type,
  severity,
  description,
  startTime,
  endTime,
  employeeId,
  confidence,
}: AnomalyAlertProps) {
  const getSeverityConfig = () => {
    switch (severity) {
      case 'CRITICAL':
        return {
          icon: XCircle,
          className: 'border-red-500 bg-red-50',
          badgeVariant: 'destructive' as const,
        };
      case 'HIGH':
        return {
          icon: AlertTriangle,
          className: 'border-orange-500 bg-orange-50',
          badgeVariant: 'warning' as const,
        };
      case 'MEDIUM':
        return {
          icon: AlertCircle,
          className: 'border-yellow-500 bg-yellow-50',
          badgeVariant: 'warning' as const,
        };
      default:
        return {
          icon: Info,
          className: 'border-blue-500 bg-blue-50',
          badgeVariant: 'info' as const,
        };
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      TAILGATING: '꼬리물기',
      LONG_ABSENCE: '장시간 외출',
      NO_WORK: '업무 미수행',
      SHIFT_OVERLAP: '교대 겹침',
      MISSING_ENTRY: '출근 누락',
      MISSING_EXIT: '퇴근 누락',
      DUPLICATE_TAG: '중복 태그',
      ABNORMAL_HOURS: '비정상 시간',
    };
    return labels[type] || type;
  };

  const config = getSeverityConfig();
  const Icon = config.icon;

  return (
    <Alert className={config.className}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        <span>{getTypeLabel(type)}</span>
        <Badge variant={config.badgeVariant}>{severity}</Badge>
        {confidence && (
          <span className="text-xs text-gray-500">
            신뢰도: {(confidence * 100).toFixed(0)}%
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="font-medium">{description}</p>
        <div className="mt-2 text-sm text-gray-600">
          {employeeId && (
            <div>직원 ID: {employeeId}</div>
          )}
          <div>
            시작: {format(new Date(startTime), 'PPP HH:mm', { locale: ko })}
          </div>
          {endTime && (
            <div>
              종료: {format(new Date(endTime), 'PPP HH:mm', { locale: ko })}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}