import { NextRequest, NextResponse } from 'next/server';
import { organizationAggregator } from '@/lib/services/organizationAggregator';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const organizationId = searchParams.get('organizationId');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const level = searchParams.get('level');
    const parentId = searchParams.get('parentId');
    const metric = searchParams.get('metric');
    
    // 계층별 집계
    if (level !== null) {
      const data = await organizationAggregator.aggregateHierarchicalData(
        parseInt(level),
        parentId ? parseInt(parentId) : undefined,
        date || undefined
      );
      
      return NextResponse.json({
        success: true,
        data
      });
    }
    
    // 트렌드 분석
    if (organizationId && startDate && endDate) {
      const trends = await organizationAggregator.getOrganizationTrends(
        parseInt(organizationId),
        startDate,
        endDate,
        metric || 'work_time'
      );
      
      return NextResponse.json({
        success: true,
        data: trends
      });
    }
    
    // 일일 집계
    if (organizationId && date) {
      const metrics = await organizationAggregator.aggregateDailyData(
        parseInt(organizationId),
        date
      );
      
      return NextResponse.json({
        success: true,
        data: metrics
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in organization analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to analyze organization data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, date, year, month } = body;
    
    // 월간 집계
    if (organizationId && year && month) {
      const monthlyData = await organizationAggregator.aggregateMonthlyData(
        organizationId,
        year,
        month
      );
      
      return NextResponse.json({
        success: true,
        data: monthlyData
      });
    }
    
    // 일일 집계 (강제 재계산)
    if (organizationId && date) {
      const metrics = await organizationAggregator.aggregateDailyData(
        organizationId,
        date
      );
      
      return NextResponse.json({
        success: true,
        data: metrics
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error aggregating organization data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to aggregate organization data' },
      { status: 500 }
    );
  }
}