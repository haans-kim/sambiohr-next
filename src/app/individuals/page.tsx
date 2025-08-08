'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  User, 
  Clock, 
  Activity, 
  TrendingUp,
  Calendar,
  ChevronRight 
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Individual {
  id: number;
  employee_id: string;
  name: string;
  center?: string;
  team?: string;
  group_name?: string;
  work_type?: string;
  shift_type?: string;
}

export default function IndividualsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Individual | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: individuals, isLoading } = useQuery({
    queryKey: ['individuals'],
    queryFn: async () => {
      const response = await fetch('/api/individuals');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      return result.data as Individual[];
    },
  });

  const { data: dailySummary } = useQuery({
    queryKey: ['daily-summary', selectedEmployee?.employee_id, selectedDate],
    queryFn: async () => {
      if (!selectedEmployee) return null;
      const response = await fetch(
        `/api/individuals/${selectedEmployee.employee_id}/daily?date=${selectedDate}`
      );
      if (!response.ok) return null;
      const result = await response.json();
      return result.data;
    },
    enabled: !!selectedEmployee,
  });

  const filteredIndividuals = individuals?.filter(
    (ind) =>
      ind.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ind.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">개인 분석</h1>
        <p className="text-gray-600">개인별 근무 패턴 및 성과 분석</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>직원 목록</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="이름 또는 사번으로 검색"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16" />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredIndividuals?.map((individual) => (
                      <div
                        key={individual.id}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedEmployee?.id === individual.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedEmployee(individual)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">{individual.name}</p>
                              <p className="text-sm text-gray-500">{individual.employee_id}</p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="mt-2 flex gap-2">
                          {individual.center && (
                            <Badge variant="outline" className="text-xs">
                              {individual.center}
                            </Badge>
                          )}
                          {individual.team && (
                            <Badge variant="outline" className="text-xs">
                              {individual.team}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Details */}
        <div className="lg:col-span-2">
          {selectedEmployee ? (
            <div className="space-y-6">
              {/* Employee Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-8 w-8 text-gray-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedEmployee.name}</h2>
                        <p className="text-gray-500">{selectedEmployee.employee_id}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {selectedEmployee.work_type && (
                        <Badge>{selectedEmployee.work_type}</Badge>
                      )}
                      {selectedEmployee.shift_type && (
                        <Badge variant="outline">{selectedEmployee.shift_type}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">센터</p>
                      <p className="font-medium">{selectedEmployee.center || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">팀</p>
                      <p className="font-medium">{selectedEmployee.team || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">그룹</p>
                      <p className="font-medium">{selectedEmployee.group_name || '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Date Selector */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    날짜 선택
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </CardContent>
              </Card>

              {/* Daily Summary */}
              {dailySummary && (
                <Card>
                  <CardHeader>
                    <CardTitle>일일 근무 요약</CardTitle>
                    <p className="text-sm text-gray-500">
                      {format(new Date(selectedDate), 'PPP', { locale: ko })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-500">출근 시간</p>
                        </div>
                        <p className="text-xl font-bold">
                          {dailySummary.attendance_time?.toFixed(1) || '0'}h
                        </p>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-blue-400" />
                          <p className="text-sm text-gray-500">실제 근무</p>
                        </div>
                        <p className="text-xl font-bold text-blue-600">
                          {dailySummary.work_time?.toFixed(1) || '0'}h
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-400" />
                          <p className="text-sm text-gray-500">추정률</p>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          {dailySummary.estimation_rate?.toFixed(1) || '0'}%
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="h-4 w-4 text-purple-400" />
                          <p className="text-sm text-gray-500">신뢰도</p>
                        </div>
                        <p className="text-xl font-bold text-purple-600">
                          {(dailySummary.reliability_score * 100)?.toFixed(0) || '0'}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">회의 시간</span>
                        <span className="font-medium">
                          {dailySummary.meeting_time?.toFixed(1) || '0'}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">식사 시간</span>
                        <span className="font-medium">
                          {dailySummary.meal_time?.toFixed(1) || '0'}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">휴식 시간</span>
                        <span className="font-medium">
                          {dailySummary.rest_time?.toFixed(1) || '0'}h
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">이동 시간</span>
                        <span className="font-medium">
                          {dailySummary.movement_time?.toFixed(1) || '0'}h
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">직원을 선택하여 상세 정보를 확인하세요</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}