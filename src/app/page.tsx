'use client';

import { useOrganizations } from '@/lib/hooks/useOrganizations';
import { useStore } from '@/lib/stores/useStore';
import Link from 'next/link';

export default function Home() {
  const { data: centers, isLoading } = useOrganizations(1);
  const { selectedOrganization, setSelectedOrganization } = useStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Samsung Biologics HR Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard" className="block">
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">조직 대시보드</h2>
            <p className="text-gray-600">센터/팀/그룹별 성과 분석</p>
          </div>
        </Link>
        
        <Link href="/individuals" className="block">
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">개인 분석</h2>
            <p className="text-gray-600">개인별 근무 패턴 분석</p>
          </div>
        </Link>
        
        <Link href="/upload" className="block">
          <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
            <h2 className="text-xl font-semibold mb-2">데이터 업로드</h2>
            <p className="text-gray-600">Excel 파일 업로드</p>
          </div>
        </Link>
      </div>
      
      {centers && centers.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">센터 목록</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {centers.map((center) => (
              <div
                key={center.id}
                onClick={() => setSelectedOrganization(center)}
                className={`p-4 border rounded cursor-pointer hover:bg-gray-50 ${
                  selectedOrganization?.id === center.id ? 'bg-blue-50 border-blue-500' : ''
                }`}
              >
                <div className="font-medium">{center.center}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-12 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">마이그레이션 진행 상황</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>Next.js 프로젝트 설정 완료</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>Better-SQLite3 데이터베이스 설정 완료</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-green-500 rounded-full mr-2"></span>
            <span>API 라우트 기본 구조 완료</span>
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-yellow-500 rounded-full mr-2"></span>
            <span>컴포넌트 마이그레이션 진행중...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
