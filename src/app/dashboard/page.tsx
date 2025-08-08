'use client';

import { useState } from 'react';
import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { OrganizationCard } from '@/components/organization/OrganizationCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Building2, Users, BarChart3 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BreadcrumbItem {
  id: number;
  name: string;
  level: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentLevel, setCurrentLevel] = useState(1);
  const [parentId, setParentId] = useState<number | undefined>(undefined);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: 0, name: '전체', level: 0 }
  ]);

  const { data: organizations, isLoading } = useOrganizations(currentLevel, parentId);

  const handleOrganizationClick = (org: any) => {
    if (currentLevel < 3) {
      setBreadcrumbs([...breadcrumbs, { 
        id: org.id, 
        name: org.center || org.team || org.group_name, 
        level: org.level 
      }]);
      setCurrentLevel(org.level + 1);
      setParentId(org.id);
    } else {
      // 최하위 레벨 - 상세 페이지로 이동
      router.push(`/organizations/${org.id}`);
    }
  };

  const handleBreadcrumbClick = (item: BreadcrumbItem, index: number) => {
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
    if (item.level === 0) {
      setCurrentLevel(1);
      setParentId(undefined);
    } else {
      setCurrentLevel(item.level + 1);
      setParentId(item.id);
    }
  };

  const getLevelTitle = () => {
    switch (currentLevel) {
      case 1: return '센터';
      case 2: return '팀';
      case 3: return '그룹';
      default: return '조직';
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">조직 대시보드</h1>
        <p className="text-gray-600">조직별 성과 분석 및 관리</p>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        {breadcrumbs.map((item, index) => (
          <div key={item.id} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
            <Button
              variant={index === breadcrumbs.length - 1 ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleBreadcrumbClick(item, index)}
            >
              {item.name}
            </Button>
          </div>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">전체 {getLevelTitle()}</p>
              <p className="text-2xl font-bold">{organizations?.length || 0}</p>
            </div>
            <Building2 className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">총 인원</p>
              <p className="text-2xl font-bold">
                {organizations?.reduce((sum, org) => sum + (org.total_employees || 0), 0) || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">평균 성과</p>
              <p className="text-2xl font-bold">
                {organizations && organizations.length > 0
                  ? (organizations.reduce((sum, org) => sum + (org.performance_score || 0), 0) / organizations.length).toFixed(1)
                  : '0'}
              </p>
            </div>
            <BarChart3 className="h-8 w-8 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Organization Cards */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold">{getLevelTitle()} 목록</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : organizations && organizations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              center={org.center}
              team={org.team}
              group={org.group_name}
              totalEmployees={org.total_employees || 0}
              avgWorkTime={org.avg_work_time || 0}
              avgEstimationRate={org.avg_estimation_rate || 0}
              performanceScore={org.performance_score || 75}
              onClick={() => handleOrganizationClick(org)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">조직 데이터가 없습니다.</p>
        </div>
      )}
    </div>
  );
}