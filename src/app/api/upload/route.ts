import { NextRequest, NextResponse } from 'next/server';
import { ExcelProcessor } from '@/lib/services/excelProcessor';
import { getDatabase } from '@/lib/db';
import Database from 'better-sqlite3';

interface UploadResult {
  success: boolean;
  message: string;
  processed?: number;
  failed?: number;
  errors?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!type || !['tags', 'employees', 'meals', 'equipment'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type' },
        { status: 400 }
      );
    }

    let result: UploadResult;

    switch (type) {
      case 'tags':
        result = await processTagFile(file);
        break;
      case 'employees':
        result = await processEmployeeFile(file);
        break;
      case 'meals':
        result = await processMealFile(file);
        break;
      case 'equipment':
        result = await processEquipmentFile(file);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported file type' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}

async function processTagFile(file: File): Promise<UploadResult> {
  const result = await ExcelProcessor.processTagData(file);
  
  if (!result.success || !result.data) {
    return {
      success: false,
      message: result.error || 'Failed to process file',
    };
  }

  const db = getDatabase();
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  // Insert data in a transaction
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO tag_data (
      employee_id, tag_code, timestamp, gate_name, direction
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((data: any[]) => {
    for (const record of data) {
      try {
        insertStmt.run(
          record.employee_id,
          record.tag_code,
          record.timestamp,
          record.gate_name || null,
          record.direction || null
        );
        processed++;
      } catch (error) {
        failed++;
        errors.push(`Row ${processed + failed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  });

  try {
    transaction(result.data);
  } catch (error) {
    return {
      success: false,
      message: 'Database transaction failed',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }

  return {
    success: true,
    message: `Successfully processed ${processed} tag records`,
    processed,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

async function processEmployeeFile(file: File): Promise<UploadResult> {
  const result = await ExcelProcessor.processEmployeeData(file);
  
  if (!result.success || !result.data) {
    return {
      success: false,
      message: result.error || 'Failed to process file',
    };
  }

  const db = getDatabase();
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO individuals (
      employee_id, name, center, team, group_name, work_type, shift_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((data: any[]) => {
    for (const record of data) {
      try {
        insertStmt.run(
          record.employee_id,
          record.name,
          record.center || null,
          record.team || null,
          record.group_name || null,
          record.work_type || null,
          record.shift_type || null
        );
        processed++;
      } catch (error) {
        failed++;
        errors.push(`Row ${processed + failed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  });

  try {
    transaction(result.data);
  } catch (error) {
    return {
      success: false,
      message: 'Database transaction failed',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }

  // Update organizations table based on employee data
  updateOrganizationsFromEmployees(db);

  return {
    success: true,
    message: `Successfully processed ${processed} employee records`,
    processed,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

async function processMealFile(file: File): Promise<UploadResult> {
  const result = await ExcelProcessor.processMealData(file);
  
  if (!result.success || !result.data) {
    return {
      success: false,
      message: result.error || 'Failed to process file',
    };
  }

  const db = getDatabase();
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  // Insert meal data as tag data with M1/M2 codes
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO tag_data (
      employee_id, tag_code, timestamp, gate_name
    ) VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction((data: any[]) => {
    for (const record of data) {
      try {
        insertStmt.run(
          record.employee_id,
          record.tag_code, // M1 or M2
          record.meal_time,
          record.cafeteria || 'Cafeteria'
        );
        processed++;
      } catch (error) {
        failed++;
        errors.push(`Row ${processed + failed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  });

  try {
    transaction(result.data);
  } catch (error) {
    return {
      success: false,
      message: 'Database transaction failed',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }

  return {
    success: true,
    message: `Successfully processed ${processed} meal records`,
    processed,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

async function processEquipmentFile(file: File): Promise<UploadResult> {
  const result = await ExcelProcessor.processEquipmentData(file);
  
  if (!result.success || !result.data) {
    return {
      success: false,
      message: result.error || 'Failed to process file',
    };
  }

  const db = getDatabase();
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  // Insert equipment data as tag data with O code
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO tag_data (
      employee_id, tag_code, timestamp, gate_name
    ) VALUES (?, ?, ?, ?)
  `);

  const transaction = db.transaction((data: any[]) => {
    for (const record of data) {
      try {
        // Insert start time as O tag
        insertStmt.run(
          record.employee_id,
          'O',
          record.start_time,
          record.equipment || 'Equipment'
        );
        
        // If end time exists, insert it as well
        if (record.end_time) {
          insertStmt.run(
            record.employee_id,
            'O',
            record.end_time,
            record.equipment || 'Equipment'
          );
        }
        
        processed++;
      } catch (error) {
        failed++;
        errors.push(`Row ${processed + failed}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  });

  try {
    transaction(result.data);
  } catch (error) {
    return {
      success: false,
      message: 'Database transaction failed',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }

  return {
    success: true,
    message: `Successfully processed ${processed} equipment records`,
    processed,
    failed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

function updateOrganizationsFromEmployees(db: Database.Database) {
  // Clear existing organizations
  db.prepare('DELETE FROM organizations').run();

  // Insert unique centers (level 1)
  db.prepare(`
    INSERT INTO organizations (center, level, parent_id)
    SELECT DISTINCT center, 1, NULL
    FROM individuals
    WHERE center IS NOT NULL
  `).run();

  // Insert unique teams (level 2)
  db.prepare(`
    INSERT INTO organizations (center, team, level, parent_id)
    SELECT DISTINCT i.center, i.team, 2, o.id
    FROM individuals i
    JOIN organizations o ON o.center = i.center AND o.level = 1
    WHERE i.team IS NOT NULL
  `).run();

  // Insert unique groups (level 3)
  db.prepare(`
    INSERT INTO organizations (center, team, group_name, level, parent_id)
    SELECT DISTINCT i.center, i.team, i.group_name, 3, o.id
    FROM individuals i
    JOIN organizations o ON o.center = i.center AND o.team = i.team AND o.level = 2
    WHERE i.group_name IS NOT NULL
  `).run();
}