'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/upload/FileUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  Users, 
  UtensilsCrossed, 
  Monitor,
  CheckCircle,
  AlertCircle,
  Upload
} from 'lucide-react';

type FileType = 'tags' | 'employees' | 'meals' | 'equipment';

interface UploadSection {
  type: FileType;
  title: string;
  description: string;
  icon: React.ReactNode;
  acceptedFormats: string[];
  color: string;
}

export default function UploadPage() {
  const [uploadResults, setUploadResults] = useState<Record<FileType, any>>({
    tags: null,
    employees: null,
    meals: null,
    equipment: null,
  });
  const [activeSection, setActiveSection] = useState<FileType>('tags');

  const uploadSections: UploadSection[] = [
    {
      type: 'tags',
      title: '태그 데이터',
      description: '출입 게이트 태그 기록 데이터',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      acceptedFormats: ['.xlsx', '.xls', '.csv'],
      color: 'blue',
    },
    {
      type: 'employees',
      title: '직원 마스터',
      description: '직원 정보 및 조직 구조 데이터',
      icon: <Users className="h-5 w-5" />,
      acceptedFormats: ['.xlsx', '.xls', '.csv'],
      color: 'green',
    },
    {
      type: 'meals',
      title: '식사 데이터',
      description: '식당 이용 및 식사 시간 데이터',
      icon: <UtensilsCrossed className="h-5 w-5" />,
      acceptedFormats: ['.xlsx', '.xls', '.csv'],
      color: 'yellow',
    },
    {
      type: 'equipment',
      title: '장비 로그',
      description: '장비 사용 및 업무 확인 데이터',
      icon: <Monitor className="h-5 w-5" />,
      acceptedFormats: ['.xlsx', '.xls', '.csv'],
      color: 'purple',
    },
  ];

  const handleUpload = async (files: File[], type: FileType): Promise<void> => {
    const results: any[] = [];
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();
        results.push({
          filename: file.name,
          ...result,
        });
      } catch (error) {
        results.push({
          filename: file.name,
          success: false,
          error: error instanceof Error ? error.message : 'Upload failed',
        });
      }
    }

    setUploadResults(prev => ({
      ...prev,
      [type]: results,
    }));
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'border-blue-500 bg-blue-50',
      green: 'border-green-500 bg-green-50',
      yellow: 'border-yellow-500 bg-yellow-50',
      purple: 'border-purple-500 bg-purple-50',
    };
    return colorMap[color] || 'border-gray-500 bg-gray-50';
  };

  const clearResults = () => {
    setUploadResults({
      tags: null,
      employees: null,
      meals: null,
      equipment: null,
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">데이터 업로드</h1>
            <p className="text-gray-600">Excel 파일을 업로드하여 데이터를 가져옵니다</p>
          </div>
          {Object.values(uploadResults).some(r => r !== null) && (
            <Button variant="outline" onClick={clearResults}>
              결과 초기화
            </Button>
          )}
        </div>
      </div>

      {/* Upload Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {uploadSections.map((section) => (
          <Card
            key={section.type}
            className={`cursor-pointer transition-all ${
              activeSection === section.type
                ? getColorClass(section.color) + ' border-2'
                : 'hover:shadow-lg'
            }`}
            onClick={() => setActiveSection(section.type)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColorClass(section.color)}`}>
                  {section.icon}
                </div>
                <div>
                  <p className="font-semibold">{section.title}</p>
                  <p className="text-xs text-gray-500">{section.description}</p>
                </div>
              </div>
              {uploadResults[section.type] && (
                <div className="mt-2">
                  <Badge variant="success" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    업로드 완료
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Component */}
        <div>
          {uploadSections
            .filter((section) => section.type === activeSection)
            .map((section) => (
              <div key={section.type}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  {section.icon}
                  {section.title} 업로드
                </h2>
                <FileUpload
                  acceptedTypes={section.acceptedFormats}
                  maxSize={50}
                  onUpload={(files) => handleUpload(files, section.type)}
                  multiple={true}
                />
              </div>
            ))}
        </div>

        {/* Upload Results */}
        <div>
          <h2 className="text-xl font-semibold mb-4">업로드 결과</h2>
          
          {uploadResults[activeSection] ? (
            <div className="space-y-4">
              {uploadResults[activeSection].map((result: any, index: number) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {result.filename}
                      </CardTitle>
                      <Badge variant={result.success ? 'success' : 'destructive'}>
                        {result.success ? '성공' : '실패'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {result.success ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">{result.message}</p>
                        {result.processed !== undefined && (
                          <div className="flex gap-4 text-sm">
                            <span className="text-green-600">
                              처리: {result.processed}건
                            </span>
                            {result.failed > 0 && (
                              <span className="text-red-600">
                                실패: {result.failed}건
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Alert className="border-red-200 bg-red-50">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {result.error || result.message}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {result.errors && result.errors.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-sm text-gray-500 cursor-pointer">
                          오류 상세 ({result.errors.length}건)
                        </summary>
                        <div className="mt-2 max-h-40 overflow-y-auto">
                          {result.errors.map((error: string, i: number) => (
                            <p key={i} className="text-xs text-red-600 mb-1">
                              {error}
                            </p>
                          ))}
                        </div>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  파일을 업로드하면 결과가 여기에 표시됩니다
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Instructions */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>업로드 가이드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">태그 데이터 형식</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 사번 (Employee ID)</li>
                <li>• 태그코드 (Tag Code): G1-G4, T1-T3, N1-N2</li>
                <li>• 시간 (Timestamp)</li>
                <li>• 게이트 (Gate) - 선택</li>
                <li>• 방향 (Direction): IN/OUT - 선택</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">직원 마스터 형식</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 사번 (Employee ID)</li>
                <li>• 이름 (Name)</li>
                <li>• 센터 (Center)</li>
                <li>• 팀 (Team)</li>
                <li>• 그룹 (Group)</li>
                <li>• 근무형태 (Work Type)</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">식사 데이터 형식</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 사번 (Employee ID)</li>
                <li>• 식사시간 (Meal Time)</li>
                <li>• 식사종류 (Meal Type)</li>
                <li>• 식당 (Cafeteria) - 선택</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">장비 로그 형식</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 사번 (Employee ID)</li>
                <li>• 장비 (Equipment)</li>
                <li>• 시작시간 (Start Time)</li>
                <li>• 종료시간 (End Time) - 선택</li>
                <li>• 활동 (Activity) - 선택</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}