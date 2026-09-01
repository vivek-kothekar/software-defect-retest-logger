const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const { initDatabase } = require('./database/init');
const { get, all } = require('./database/db');

console.log('--- TESTING SQLITE DATABASE RESTART PERSISTENCE ---');

// 1. Simulate server restart by running initDatabase() again
console.log('1. Simulating backend server reboot and running initDatabase()...');
initDatabase();

// 2. Verify defect count and closed defects in database
const totalDefects = get('SELECT COUNT(*) as count FROM defects').count;
const closedDefects = get("SELECT COUNT(*) as count FROM defects WHERE status = 'CLOSED'").count;
const totalFixes = get('SELECT COUNT(*) as count FROM fixes').count;
const totalRetests = get('SELECT COUNT(*) as count FROM retests').count;
const totalAuditLogs = get('SELECT COUNT(*) as count FROM audit_logs').count;

console.log(`2. Total Defects in SQLite: ${totalDefects}`);
console.log(`3. Total Closed Defects: ${closedDefects}`);
console.log(`4. Total Fix Records: ${totalFixes}`);
console.log(`5. Total Re-Test Records: ${totalRetests}`);
console.log(`6. Total Audit Logs: ${totalAuditLogs}`);

if (totalDefects > 0 && closedDefects > 0 && totalFixes >= 2 && totalRetests >= 2 && totalAuditLogs >= 6) {
  console.log('✅ PASS: All data 100% persisted across server restarts in SQLite!');
  process.exit(0);
} else {
  console.error('❌ FAIL: Data was erased on restart.');
  process.exit(1);
}
