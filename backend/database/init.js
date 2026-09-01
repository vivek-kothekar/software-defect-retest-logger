const { db, get, all, run, exec } = require('./db');

function initDatabase() {
  console.log('[DB] Initializing SQLite database schema...');

  // Create tables if they don't exist
  exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS defects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      defect_code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      priority TEXT NOT NULL,
      module TEXT NOT NULL,
      steps_to_reproduce TEXT NOT NULL,
      expected_result TEXT NOT NULL,
      actual_result TEXT NOT NULL,
      assigned_developer INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN',
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assigned_developer) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS fixes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      defect_id INTEGER NOT NULL,
      developer_id INTEGER NOT NULL,
      fix_description TEXT NOT NULL,
      root_cause TEXT NOT NULL,
      build_version TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (defect_id) REFERENCES defects(id),
      FOREIGN KEY (developer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS retests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      defect_id INTEGER NOT NULL,
      tester_id INTEGER NOT NULL,
      attempt_number INTEGER NOT NULL,
      result TEXT NOT NULL,
      environment TEXT DEFAULT 'Staging',
      comments TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (defect_id) REFERENCES defects(id),
      FOREIGN KEY (tester_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      defect_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (defect_id) REFERENCES defects(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  console.log('[DB] Tables verified.');

  // Seed default demo users if not present
  const demoUsers = [
    { name: 'Sarah Jenkins (QA Tester)', email: 'qa@test.com', password: '123456', role: 'QA_TESTER' },
    { name: 'Alex Rivera (Developer 1)', email: 'developer@test.com', password: '123456', role: 'DEVELOPER' },
    { name: 'David Chen (Developer 2)', email: 'developer2@test.com', password: '123456', role: 'DEVELOPER' },
    { name: 'Elena Vance (QA Lead)', email: 'lead@test.com', password: '123456', role: 'QA_LEAD' }
  ];

  for (const u of demoUsers) {
    const existing = get('SELECT id FROM users WHERE email = ?', [u.email]);
    if (!existing) {
      run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [u.name, u.email, u.password, u.role]
      );
      console.log(`[DB] Seeded user: ${u.email} (${u.role})`);
    }
  }

  // Check if any defects exist, if none, optionally seed a clean starter defect
  const defectCount = get('SELECT COUNT(*) as count FROM defects').count;
  if (defectCount === 0) {
    console.log('[DB] Seeding starter sample defect for college demo...');
    const qaUser = get('SELECT id FROM users WHERE email = ?', ['qa@test.com']);
    const devUser = get('SELECT id FROM users WHERE email = ?', ['developer@test.com']);

    if (qaUser && devUser) {
      const res = run(
        `INSERT INTO defects (
          defect_code, title, description, severity, priority, module,
          steps_to_reproduce, expected_result, actual_result,
          assigned_developer, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'BUG-1000',
          'Sample: Profile avatar upload throws 500 server error',
          'When uploading JPG images larger than 2MB in Profile settings, the server returns 500 Internal Server Error instead of validating file size.',
          'Medium',
          'P3',
          'User Profile',
          '1. Go to Settings > Profile\n2. Click Change Avatar\n3. Select 3MB JPG image\n4. Click Save',
          'System displays friendly "File size must be under 2MB" alert',
          'HTTP 500 error returned and page crashes',
          devUser.id,
          'OPEN',
          qaUser.id
        ]
      );

      const defectId = res.lastInsertRowid;
      run(
        'INSERT INTO audit_logs (defect_id, user_id, action, description) VALUES (?, ?, ?, ?)',
        [defectId, qaUser.id, 'DEFECT_CREATED', 'Defect BUG-1000 logged and assigned to Developer']
      );
      console.log('[DB] Seeded initial defect BUG-1000.');
    }
  }

  console.log('[DB] Database initialization complete.');
}

if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
