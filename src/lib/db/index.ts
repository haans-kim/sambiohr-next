import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = process.env.DATABASE_PATH || './data/sambiohr4.db';
    const fullPath = path.resolve(process.cwd(), dbPath);
    
    // 디렉토리가 없으면 생성
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    db = new Database(fullPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    
    // 초기 스키마 생성
    initializeSchema(db);
  }
  
  return db;
}

function initializeSchema(database: Database.Database) {
  // 조직 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      center TEXT NOT NULL,
      team TEXT,
      group_name TEXT,
      level INTEGER NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES organizations (id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_org_level ON organizations(level);
    CREATE INDEX IF NOT EXISTS idx_org_parent ON organizations(parent_id);
  `);
  
  // 개인 데이터 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS individuals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      organization_id INTEGER,
      work_type TEXT,
      shift_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organization_id) REFERENCES organizations (id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_ind_employee ON individuals(employee_id);
    CREATE INDEX IF NOT EXISTS idx_ind_org ON individuals(organization_id);
  `);
  
  // 태그 데이터 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS tag_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      tag_code TEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      date DATE NOT NULL,
      activity_state TEXT,
      reliability_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES individuals (employee_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_tag_employee ON tag_data(employee_id);
    CREATE INDEX IF NOT EXISTS idx_tag_date ON tag_data(date);
    CREATE INDEX IF NOT EXISTS idx_tag_timestamp ON tag_data(timestamp);
  `);
  
  // 일일 집계 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS daily_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      date DATE NOT NULL,
      attendance_time REAL,
      work_time REAL,
      meeting_time REAL,
      meal_time REAL,
      rest_time REAL,
      movement_time REAL,
      estimation_rate REAL,
      reliability_score REAL,
      shift_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id, date),
      FOREIGN KEY (employee_id) REFERENCES individuals (employee_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_daily_employee ON daily_summary(employee_id);
    CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_summary(date);
  `);
  
  // 조직별 집계 테이블
  database.exec(`
    CREATE TABLE IF NOT EXISTS organization_summary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organization_id INTEGER NOT NULL,
      date DATE NOT NULL,
      total_employees INTEGER,
      avg_attendance_time REAL,
      avg_work_time REAL,
      avg_estimation_rate REAL,
      avg_reliability_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(organization_id, date),
      FOREIGN KEY (organization_id) REFERENCES organizations (id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_org_sum_org ON organization_summary(organization_id);
    CREATE INDEX IF NOT EXISTS idx_org_sum_date ON organization_summary(date);
  `);
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}