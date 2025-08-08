'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Building2, 
  Users, 
  FileSpreadsheet, 
  BarChart3,
  Activity,
  Upload,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: <Building2 className="h-8 w-8" />,
      title: '조직 대시보드',
      description: '센터, 팀, 그룹 단위의 계층적 성과 분석',
      href: '/dashboard',
      color: 'blue',
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: '개인 분석',
      description: '개인별 근무 패턴 및 활동 분석',
      href: '/individuals',
      color: 'green',
    },
    {
      icon: <Upload className="h-8 w-8" />,
      title: '데이터 업로드',
      description: 'Excel 파일 업로드 및 데이터 가져오기',
      href: '/upload',
      color: 'purple',
    },
    {
      icon: <Activity className="h-8 w-8" />,
      title: '이상 패턴 감지',
      description: '태깅 이상 패턴 자동 감지 및 알림',
      href: '/anomalies',
      color: 'red',
    },
  ];

  const stats = [
    { label: '등록 직원', value: '2,847', change: '+12%' },
    { label: '활성 조직', value: '124', change: '+5%' },
    { label: '데이터 정확도', value: '98.5%', change: '+2.3%' },
    { label: '처리 레코드', value: '1.2M', change: '+145K' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Samsung Biologics</h1>
                <p className="text-sm text-gray-500">HR Analytics System</p>
              </div>
            </div>
            <Button 
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              대시보드 시작
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            AI 기반 인력 운영 고도화 시스템
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            태그 데이터 기반의 직원 활동 패턴 분석을 통해 조직 효율성을 극대화하고
            데이터 기반 의사결정을 지원합니다
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className="flex items-center text-green-600 text-sm">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {stat.change}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(feature.href)}
            >
              <CardHeader>
                <div className={`inline-flex p-3 rounded-lg bg-${feature.color}-100 text-${feature.color}-600 mb-4`}>
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{feature.description}</p>
                <Button variant="ghost" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                  자세히 보기 →
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Key Features Section */}
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">주요 기능</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">태그 데이터 처리</h4>
              <p className="text-sm text-gray-600">
                G1-G4, T1-T3, N1-N2, M1-M2, O 태그를 통한 정밀한 활동 추적
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Activity className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">실시간 분석</h4>
              <p className="text-sm text-gray-600">
                전이 확률 매트릭스 기반 활동 상태 추론 및 패턴 분석
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="font-semibold mb-2">성과 지표</h4>
              <p className="text-sm text-gray-600">
                출근율, 근무시간, 추정률, 신뢰도 등 다차원 성과 평가
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="py-12">
              <h3 className="text-2xl font-bold mb-4">지금 시작하세요</h3>
              <p className="text-lg mb-6 opacity-90">
                데이터 기반 의사결정으로 조직 효율성을 극대화하세요
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  onClick={() => router.push('/upload')}
                >
                  데이터 업로드
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                  onClick={() => router.push('/dashboard')}
                >
                  대시보드 보기
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}