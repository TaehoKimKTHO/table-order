import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { SCHEMA_SQL } from './schema';
import { SEED_SQL } from './seed';

let db: SqlJsDatabase | null = null;
let initPromise: Promise<SqlJsDatabase> | null = null;

const DB_PATH = path.join(process.cwd(), 'data', 'table-order.db');

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs();

    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      const buffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    initializeDb(db);
    seedData(db);
    saveDb(db);
    return db;
  })();

  return initPromise;
}

function initializeDb(database: SqlJsDatabase): void {
  database.run('PRAGMA journal_mode = WAL');
  database.run('PRAGMA foreign_keys = ON');
  database.exec(SCHEMA_SQL);
}

function seedData(database: SqlJsDatabase): void {
  const result = database.exec('SELECT COUNT(*) as count FROM store');
  const count = result.length > 0 ? (result[0].values[0][0] as number) : 0;
  if (count > 0) return;
  database.exec(SEED_SQL);
}

export function saveDb(database?: SqlJsDatabase): void {
  const d = database ?? db;
  if (!d) return;
  const data = d.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

// Helper to run a query and get results as objects
export function queryAll<T>(sql: string, params: unknown[] = []): T[] {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T>(sql: string, params: unknown[] = []): T | undefined {
  const results = queryAll<T>(sql, params);
  return results[0];
}

export function run(sql: string, params: unknown[] = []): void {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  saveDb();
}

export function exec(sql: string): void {
  if (!db) throw new Error('Database not initialized');
  db.exec(sql);
  saveDb();
}
