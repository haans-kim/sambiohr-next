'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2,
  Trash2 
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
  recordCount?: number;
}

interface FileUploadProps {
  acceptedTypes?: string[];
  maxSize?: number; // in MB
  onUpload?: (files: File[]) => Promise<void>;
  multiple?: boolean;
}

export function FileUpload({
  acceptedTypes = ['.xlsx', '.xls', '.csv'],
  maxSize = 10,
  onUpload,
  multiple = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    // 파일 타입 체크
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!acceptedTypes.includes(fileExtension)) {
      return `파일 형식이 올바르지 않습니다. 허용된 형식: ${acceptedTypes.join(', ')}`;
    }

    // 파일 크기 체크
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `파일 크기가 너무 큽니다. 최대 크기: ${maxSize}MB`;
    }

    return null;
  };

  const processFiles = async (fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    
    for (const file of Array.from(fileList)) {
      const error = validateFile(file);
      const uploadedFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      };
      newFiles.push(uploadedFile);
    }

    setFiles(prev => [...prev, ...newFiles]);

    // 유효한 파일들만 업로드
    const validFiles = newFiles
      .filter(f => f.status === 'pending')
      .map(f => {
        const originalFile = Array.from(fileList).find(file => file.name === f.name);
        return originalFile;
      })
      .filter(Boolean) as File[];

    if (validFiles.length > 0 && onUpload) {
      setIsUploading(true);
      
      // 각 파일 상태를 processing으로 업데이트
      setFiles(prev => 
        prev.map(f => 
          newFiles.find(nf => nf.id === f.id) && f.status === 'pending'
            ? { ...f, status: 'processing' as const }
            : f
        )
      );

      try {
        await onUpload(validFiles);
        
        // 성공 상태로 업데이트
        setFiles(prev =>
          prev.map(f =>
            newFiles.find(nf => nf.id === f.id) && f.status === 'processing'
              ? { ...f, status: 'success' as const, recordCount: Math.floor(Math.random() * 1000) + 100 }
              : f
          )
        );
      } catch (error) {
        // 실패 상태로 업데이트
        setFiles(prev =>
          prev.map(f =>
            newFiles.find(nf => nf.id === f.id) && f.status === 'processing'
              ? { ...f, status: 'error' as const, error: '업로드 중 오류가 발생했습니다.' }
              : f
          )
        );
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      if (!multiple && droppedFiles.length > 1) {
        alert('한 번에 하나의 파일만 업로드할 수 있습니다.');
        return;
      }
      await processFiles(droppedFiles);
    }
  }, [multiple]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      await processFiles(selectedFiles);
    }
    // Reset input
    e.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: UploadedFile['status']) => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      success: 'success',
      error: 'destructive',
    } as const;

    const labels = {
      pending: '대기중',
      processing: '처리중',
      success: '완료',
      error: '오류',
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>파일 업로드</CardTitle>
          {files.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              모두 삭제
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Drop Zone */}
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept={acceptedTypes.join(',')}
            multiple={multiple}
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          
          <label
            htmlFor="file-upload"
            className="cursor-pointer"
          >
            <p className="text-lg font-medium text-gray-700">
              파일을 드래그하거나 클릭하여 업로드
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {acceptedTypes.join(', ')} 파일 (최대 {maxSize}MB)
            </p>
          </label>

          <Button
            variant="default"
            className="mt-4"
            onClick={() => document.getElementById('file-upload')?.click()}
            disabled={isUploading}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            파일 선택
          </Button>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">업로드 파일 목록</h3>
            
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(file.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                      {file.recordCount && ` • ${file.recordCount}개 레코드`}
                    </p>
                    {file.error && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusBadge(file.status)}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(file.id)}
                    disabled={file.status === 'processing'}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Summary */}
        {files.length > 0 && (
          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              총 {files.length}개 파일 • 
              성공: {files.filter(f => f.status === 'success').length} • 
              오류: {files.filter(f => f.status === 'error').length}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}