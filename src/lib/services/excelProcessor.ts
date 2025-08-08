import * as XLSX from 'xlsx';

interface ExcelRow {
  [key: string]: any;
}

interface ProcessResult {
  success: boolean;
  data?: any[];
  error?: string;
  rowCount?: number;
  columnCount?: number;
}

export class ExcelProcessor {
  /**
   * Read and parse Excel file
   */
  static async readFile(file: File): Promise<ProcessResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      
      return {
        success: true,
        data: workbook,
        rowCount: 0,
        columnCount: 0,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process tag data Excel file
   */
  static async processTagData(file: File): Promise<ProcessResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { 
        header: 1,
        defval: null,
      });

      if (jsonData.length < 2) {
        return {
          success: false,
          error: 'Excel file is empty or has no data rows',
        };
      }

      // Get headers from first row
      const headers = jsonData[0] as string[];
      const data: any[] = [];

      // Process each data row
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.every(cell => cell === null || cell === undefined)) {
          continue; // Skip empty rows
        }

        const record: any = {};
        
        // Map columns to expected structure
        headers.forEach((header, index) => {
          const value = row[index];
          
          // Map Korean headers to English field names
          switch (header) {
            case '사번':
            case 'Employee ID':
              record.employee_id = String(value || '').trim();
              break;
            case '태그코드':
            case 'Tag Code':
              record.tag_code = String(value || '').trim();
              break;
            case '시간':
            case 'Timestamp':
              record.timestamp = this.parseDateTime(value);
              break;
            case '게이트':
            case 'Gate':
              record.gate_name = String(value || '').trim();
              break;
            case '방향':
            case 'Direction':
              record.direction = String(value || '').toUpperCase() as 'IN' | 'OUT';
              break;
            default:
              // Keep other fields as is
              record[header.toLowerCase().replace(/\s+/g, '_')] = value;
          }
        });

        // Validate required fields
        if (record.employee_id && record.tag_code && record.timestamp) {
          data.push(record);
        }
      }

      return {
        success: true,
        data,
        rowCount: data.length,
        columnCount: headers.length,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process tag data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process employee data Excel file
   */
  static async processEmployeeData(file: File): Promise<ProcessResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { 
        header: 1,
        defval: null,
      });

      if (jsonData.length < 2) {
        return {
          success: false,
          error: 'Excel file is empty or has no data rows',
        };
      }

      const headers = jsonData[0] as string[];
      const data: any[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.every(cell => cell === null || cell === undefined)) {
          continue;
        }

        const record: any = {};
        
        headers.forEach((header, index) => {
          const value = row[index];
          
          switch (header) {
            case '사번':
            case 'Employee ID':
              record.employee_id = String(value || '').trim();
              break;
            case '이름':
            case 'Name':
              record.name = String(value || '').trim();
              break;
            case '센터':
            case 'Center':
              record.center = String(value || '').trim();
              break;
            case '팀':
            case 'Team':
              record.team = String(value || '').trim();
              break;
            case '그룹':
            case 'Group':
              record.group_name = String(value || '').trim();
              break;
            case '근무형태':
            case 'Work Type':
              record.work_type = String(value || '').trim();
              break;
            case '교대':
            case 'Shift':
              record.shift_type = String(value || '').trim();
              break;
            default:
              record[header.toLowerCase().replace(/\s+/g, '_')] = value;
          }
        });

        if (record.employee_id && record.name) {
          data.push(record);
        }
      }

      return {
        success: true,
        data,
        rowCount: data.length,
        columnCount: headers.length,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process employee data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process meal data Excel file
   */
  static async processMealData(file: File): Promise<ProcessResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { 
        header: 1,
        defval: null,
      });

      if (jsonData.length < 2) {
        return {
          success: false,
          error: 'Excel file is empty or has no data rows',
        };
      }

      const headers = jsonData[0] as string[];
      const data: any[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.every(cell => cell === null || cell === undefined)) {
          continue;
        }

        const record: any = {};
        
        headers.forEach((header, index) => {
          const value = row[index];
          
          switch (header) {
            case '사번':
            case 'Employee ID':
              record.employee_id = String(value || '').trim();
              break;
            case '식사시간':
            case 'Meal Time':
              record.meal_time = this.parseDateTime(value);
              break;
            case '식사종류':
            case 'Meal Type':
              record.meal_type = String(value || '').trim();
              break;
            case '식당':
            case 'Cafeteria':
              record.cafeteria = String(value || '').trim();
              break;
            default:
              record[header.toLowerCase().replace(/\s+/g, '_')] = value;
          }
        });

        if (record.employee_id && record.meal_time) {
          // Generate M1 or M2 tag based on meal type
          record.tag_code = this.getMealTagCode(record.meal_type, record.meal_time);
          data.push(record);
        }
      }

      return {
        success: true,
        data,
        rowCount: data.length,
        columnCount: headers.length,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process meal data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Process equipment log Excel file
   */
  static async processEquipmentData(file: File): Promise<ProcessResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { 
        header: 1,
        defval: null,
      });

      if (jsonData.length < 2) {
        return {
          success: false,
          error: 'Excel file is empty or has no data rows',
        };
      }

      const headers = jsonData[0] as string[];
      const data: any[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (!row || row.every(cell => cell === null || cell === undefined)) {
          continue;
        }

        const record: any = {};
        
        headers.forEach((header, index) => {
          const value = row[index];
          
          switch (header) {
            case '사번':
            case 'Employee ID':
              record.employee_id = String(value || '').trim();
              break;
            case '장비':
            case 'Equipment':
              record.equipment = String(value || '').trim();
              break;
            case '시작시간':
            case 'Start Time':
              record.start_time = this.parseDateTime(value);
              break;
            case '종료시간':
            case 'End Time':
              record.end_time = this.parseDateTime(value);
              break;
            case '활동':
            case 'Activity':
              record.activity = String(value || '').trim();
              break;
            default:
              record[header.toLowerCase().replace(/\s+/g, '_')] = value;
          }
        });

        if (record.employee_id && record.start_time) {
          // Generate O tag for equipment usage
          record.tag_code = 'O';
          data.push(record);
        }
      }

      return {
        success: true,
        data,
        rowCount: data.length,
        columnCount: headers.length,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to process equipment data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Helper: Parse date/time from various formats
   */
  private static parseDateTime(value: any): string | null {
    if (!value) return null;

    // If already a Date object (from Excel)
    if (value instanceof Date) {
      return value.toISOString();
    }

    // If it's a number (Excel date serial)
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return new Date(date.y, date.m - 1, date.d, date.H || 0, date.M || 0, date.S || 0).toISOString();
    }

    // If it's a string, try to parse it
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    return null;
  }

  /**
   * Helper: Determine meal tag code based on meal type and time
   */
  private static getMealTagCode(mealType: string, mealTime: string): string {
    const hour = new Date(mealTime).getHours();
    
    // M1: Breakfast (06:30-09:00) or Lunch (11:20-13:20)
    // M2: Dinner (17:00-20:00) or Midnight (23:30-01:00)
    
    if (mealType?.includes('조식') || mealType?.includes('Breakfast') || (hour >= 6 && hour < 9)) {
      return 'M1';
    } else if (mealType?.includes('중식') || mealType?.includes('Lunch') || (hour >= 11 && hour < 14)) {
      return 'M1';
    } else if (mealType?.includes('석식') || mealType?.includes('Dinner') || (hour >= 17 && hour < 20)) {
      return 'M2';
    } else if (mealType?.includes('야식') || mealType?.includes('Midnight') || (hour >= 23 || hour < 2)) {
      return 'M2';
    }
    
    // Default based on time
    return hour < 15 ? 'M1' : 'M2';
  }

  /**
   * Export data to Excel file
   */
  static exportToExcel(data: any[], filename: string = 'export.xlsx'): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    XLSX.writeFile(workbook, filename);
  }
}