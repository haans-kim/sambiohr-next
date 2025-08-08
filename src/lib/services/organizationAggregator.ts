// 조직별 데이터 집계 서비스
import { getDatabase } from '@/lib/db';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface OrganizationMetrics {
  organizationId: number;
  date: string;
  totalEmployees: number;
  avgAttendanceTime: number;
  avgWorkTime: number;
  avgMeetingTime: number;
  avgMealTime: number;
  avgRestTime: number;
  avgEstimationRate: number;
  avgReliabilityScore: number;
  performanceScore?: number;
}

export interface OrganizationTrend {
  date: string;
  metric: string;
  value: number;
}

export class OrganizationAggregator {
  // 일일 조직 데이터 집계
  async aggregateDailyData(organizationId: number, date: string): Promise<OrganizationMetrics> {
    const db = getDatabase();
    
    // 조직 소속 직원들의 일일 데이터 집계
    const query = `
      SELECT 
        COUNT(DISTINCT ds.employee_id) as total_employees,
        AVG(ds.attendance_time) as avg_attendance_time,
        AVG(ds.work_time) as avg_work_time,
        AVG(ds.meeting_time) as avg_meeting_time,
        AVG(ds.meal_time) as avg_meal_time,
        AVG(ds.rest_time) as avg_rest_time,
        AVG(ds.estimation_rate) as avg_estimation_rate,
        AVG(ds.reliability_score) as avg_reliability_score
      FROM daily_summary ds
      JOIN individuals i ON ds.employee_id = i.employee_id
      WHERE i.organization_id = ? AND ds.date = ?
    `;
    
    const result = db.prepare(query).get(organizationId, date) as any;
    
    if (!result || result.total_employees === 0) {
      return this.createEmptyMetrics(organizationId, date);
    }
    
    const metrics: OrganizationMetrics = {
      organizationId,
      date,
      totalEmployees: result.total_employees || 0,
      avgAttendanceTime: result.avg_attendance_time || 0,
      avgWorkTime: result.avg_work_time || 0,
      avgMeetingTime: result.avg_meeting_time || 0,
      avgMealTime: result.avg_meal_time || 0,
      avgRestTime: result.avg_rest_time || 0,
      avgEstimationRate: result.avg_estimation_rate || 0,
      avgReliabilityScore: result.avg_reliability_score || 0
    };
    
    // 성과 점수 계산
    metrics.performanceScore = this.calculatePerformanceScore(metrics);
    
    // 결과 저장
    await this.saveOrganizationMetrics(metrics);
    
    return metrics;
  }
  
  // 월간 조직 데이터 집계
  async aggregateMonthlyData(organizationId: number, year: number, month: number): Promise<OrganizationMetrics[]> {
    const db = getDatabase();
    const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
    
    const query = `
      SELECT 
        date,
        total_employees,
        avg_attendance_time,
        avg_work_time,
        avg_estimation_rate,
        avg_reliability_score
      FROM organization_summary
      WHERE organization_id = ? 
        AND date BETWEEN ? AND ?
      ORDER BY date
    `;
    
    const results = db.prepare(query).all(organizationId, startDate, endDate) as any[];
    
    return results.map(row => ({
      organizationId,
      date: row.date,
      totalEmployees: row.total_employees,
      avgAttendanceTime: row.avg_attendance_time,
      avgWorkTime: row.avg_work_time,
      avgMeetingTime: 0,
      avgMealTime: 0,
      avgRestTime: 0,
      avgEstimationRate: row.avg_estimation_rate,
      avgReliabilityScore: row.avg_reliability_score,
      performanceScore: this.calculatePerformanceScore(row)
    }));
  }
  
  // 조직 계층별 집계 (센터 -> 팀 -> 그룹)
  async aggregateHierarchicalData(level: number, parentId?: number, date?: string): Promise<any[]> {
    const db = getDatabase();
    const targetDate = date || format(new Date(), 'yyyy-MM-dd');
    
    let query = `
      SELECT 
        o.id,
        o.center,
        o.team,
        o.group_name,
        o.level,
        COUNT(DISTINCT i.employee_id) as total_employees,
        AVG(ds.work_time) as avg_work_time,
        AVG(ds.estimation_rate) as avg_estimation_rate,
        AVG(ds.reliability_score) as avg_reliability_score
      FROM organizations o
      LEFT JOIN individuals i ON i.organization_id = o.id
      LEFT JOIN daily_summary ds ON ds.employee_id = i.employee_id AND ds.date = ?
      WHERE o.level = ?
    `;
    
    const params: any[] = [targetDate, level];
    
    if (parentId !== undefined) {
      query += ' AND o.parent_id = ?';
      params.push(parentId);
    }
    
    query += ' GROUP BY o.id ORDER BY o.center, o.team, o.group_name';
    
    return db.prepare(query).all(...params) as any[];
  }
  
  // 조직 성과 트렌드 분석
  async getOrganizationTrends(
    organizationId: number,
    startDate: string,
    endDate: string,
    metric: string = 'work_time'
  ): Promise<OrganizationTrend[]> {
    const db = getDatabase();
    
    const metricColumn = this.getMetricColumn(metric);
    
    const query = `
      SELECT 
        date,
        ${metricColumn} as value
      FROM organization_summary
      WHERE organization_id = ?
        AND date BETWEEN ? AND ?
      ORDER BY date
    `;
    
    const results = db.prepare(query).all(organizationId, startDate, endDate) as any[];
    
    return results.map(row => ({
      date: row.date,
      metric,
      value: row.value || 0
    }));
  }
  
  // 성과 점수 계산
  private calculatePerformanceScore(metrics: any): number {
    const workWeight = 0.4;
    const attendanceWeight = 0.2;
    const estimationWeight = 0.2;
    const reliabilityWeight = 0.2;
    
    // 정규화 (0-100 스케일)
    const workScore = Math.min((metrics.avgWorkTime || metrics.avg_work_time || 0) / 8 * 100, 100);
    const attendanceScore = Math.min((metrics.avgAttendanceTime || metrics.avg_attendance_time || 0) / 10 * 100, 100);
    const estimationScore = metrics.avgEstimationRate || metrics.avg_estimation_rate || 0;
    const reliabilityScore = (metrics.avgReliabilityScore || metrics.avg_reliability_score || 0) * 100;
    
    return (
      workScore * workWeight +
      attendanceScore * attendanceWeight +
      estimationScore * estimationWeight +
      reliabilityScore * reliabilityWeight
    );
  }
  
  // 메트릭 컬럼 매핑
  private getMetricColumn(metric: string): string {
    const columnMap: Record<string, string> = {
      'work_time': 'avg_work_time',
      'attendance_time': 'avg_attendance_time',
      'estimation_rate': 'avg_estimation_rate',
      'reliability_score': 'avg_reliability_score',
      'total_employees': 'total_employees'
    };
    
    return columnMap[metric] || 'avg_work_time';
  }
  
  // 빈 메트릭 생성
  private createEmptyMetrics(organizationId: number, date: string): OrganizationMetrics {
    return {
      organizationId,
      date,
      totalEmployees: 0,
      avgAttendanceTime: 0,
      avgWorkTime: 0,
      avgMeetingTime: 0,
      avgMealTime: 0,
      avgRestTime: 0,
      avgEstimationRate: 0,
      avgReliabilityScore: 0,
      performanceScore: 0
    };
  }
  
  // 조직 메트릭 저장
  private async saveOrganizationMetrics(metrics: OrganizationMetrics): Promise<void> {
    const db = getDatabase();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO organization_summary (
        organization_id, date, total_employees,
        avg_attendance_time, avg_work_time,
        avg_estimation_rate, avg_reliability_score,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run(
      metrics.organizationId,
      metrics.date,
      metrics.totalEmployees,
      metrics.avgAttendanceTime,
      metrics.avgWorkTime,
      metrics.avgEstimationRate,
      metrics.avgReliabilityScore
    );
  }
}

export const organizationAggregator = new OrganizationAggregator();