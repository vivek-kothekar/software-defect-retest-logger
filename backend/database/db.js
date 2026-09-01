const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Enable Foreign Keys and WAL mode for better concurrency and performance
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Helper to run a SELECT query returning multiple rows
 */
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.all(...params);
}

/**
 * Helper to run a SELECT query returning a single row
 */
function get(sql, params = []) {
  const stmt = db.prepare(sql);
  return stmt.get(...params);
}

/**
 * Helper to run INSERT, UPDATE, DELETE queries
 * Returns { changes, lastInsertRowid }
 */
function run(sql, params = []) {
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return {
    changes: result.changes,
    lastInsertRowid: Number(result.lastInsertRowid)
  };
}

/**
 * Helper to execute raw multi-statement SQL
 */
function exec(sql) {
  return db.exec(sql);
}

module.exports = {
  db,
  all,
  get,
  run,
  exec,
  dbPath
};
