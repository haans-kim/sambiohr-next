'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  Users,
  Clock,
  TrendingUp,
  Calendar,
  ChevronLeft,
  Activity,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrganizationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const orgId = parseInt(resolvedParams.id);

  // Fetch organization details
  const { data: organization, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${orgId}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      return result.data;
    },
  });

  // Fetch organization summary
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['organization-summary', orgId],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${orgId}/summary`);
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      return result.data;
    },
  });

  // Mock data for charts (replace with actual API calls)
  const trendData = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MM/dd'),
    workTime: 7.5 + Math.random() * 2,
    estimationRate: 80 + Math.random() * 20,
    attendance: 90 + Math.random() * 10,
  }));

  const distributionData = [
    { name: '업무', value: 65, color: '#3B82F6' },
    { name: '회의', value: 15, color: '#10B981' },
    { name: '식사', value: 10, color: '#F59E0B' },
    { name: '휴식', value: 5, color: '#8B5CF6' },
    { name: '이동', value: 5, color: '#EC4899' },
  ];

  const performanceData = [
    { metric: '출근율', value: 95, benchmark: 90 },
    { metric: '근무시간', value: 85, benchmark: 80 },
    { metric: '추정률', value: 78, benchmark: 75 },
    { metric: '신뢰도', value: 92, benchmark: 85 },
  ];

  if (orgLoading || summaryLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-500">조직 정보를 찾을 수 없습니다</p>
            <Button
              className="mt-4"
              onClick={() => router.push('/dashboard')}
            >
              대시보드로 돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getOrganizationName = () => {
    return organization.group_name || organization.team || organization.center;
  };

  const getOrganizationPath = () => {
    const parts = [];
    if (organization.center) parts.push(organization.center);
    if (organization.team) parts.push(organization.team);
    if (organization.group_name) parts.push(organization.group_name);
    return parts.join(' > ');
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/dashboard')}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          대시보드로 돌아가기
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{getOrganizationName()}</h1>
            <p className="text-gray-600">{getOrganizationPath()}</p>
          </div>
          <Badge variant="default" className="text-lg px-4 py-2">
            Level {organization.level}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              총 인원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {organization.total_employees || 0}명
              </p>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              평균 근무시간
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {organization.avg_work_time?.toFixed(1) || '0'}h
              </p>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              평균 추정률
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {organization.avg_estimation_rate?.toFixed(1) || '0'}%
              </p>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">
              성과 점수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">
                {organization.performance_score?.toFixed(0) || '0'}
              </p>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>30일 추세</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="workTime"
                  stroke="#3B82F6"
                  name="근무시간(h)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="estimationRate"
                  stroke="#10B981"
                  name="추정률(%)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>활동 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>성과 지표 비교</CardTitle>
          <p className="text-sm text-gray-500">실제 vs 목표</p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6" name="실제" />
              <Bar dataKey="benchmark" fill="#E5E7EB" name="목표" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Summary Table */}
      {summary && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>일일 요약</CardTitle>
            <p className="text-sm text-gray-500">
              {format(new Date(summary.date || new Date()), 'PPP', { locale: ko })}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500">출근 시간</p>
                <p className="text-lg font-semibold">
                  {summary.attendance_time?.toFixed(1) || '0'}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">실제 근무</p>
                <p className="text-lg font-semibold">
                  {summary.work_time?.toFixed(1) || '0'}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">회의 시간</p>
                <p className="text-lg font-semibold">
                  {summary.meeting_time?.toFixed(1) || '0'}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">식사 시간</p>
                <p className="text-lg font-semibold">
                  {summary.meal_time?.toFixed(1) || '0'}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">휴식 시간</p>
                <p className="text-lg font-semibold">
                  {summary.rest_time?.toFixed(1) || '0'}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">이동 시간</p>
                <p className="text-lg font-semibold">
                  {summary.movement_time?.toFixed(1) || '0'}h
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">추정률</p>
                <p className="text-lg font-semibold">
                  {summary.estimation_rate?.toFixed(1) || '0'}%
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">신뢰도</p>
                <p className="text-lg font-semibold">
                  {(summary.reliability_score * 100)?.toFixed(0) || '0'}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}