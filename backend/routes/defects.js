const express = require('express');
const router = express.Router();
const { get, all, run } = require('../database/db');
const { authenticate, requireRoles } = require('../middleware/auth');

/**
 * Generate next unique Defect Code (e.g. BUG-1001, BUG-1002) from SQLite
 */
function generateNextDefectCode() {
  const rows = all("SELECT defect_code FROM defects WHERE defect_code LIKE 'BUG-%'");
  let maxNum = 1000;
  for (const row of rows) {
    const num = parseInt(row.defect_code.replace('BUG-', ''), 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }
  return `BUG-${maxNum + 1}`;
}

/**
 * GET /api/defects/stats/summary
 * Real-time stats calculated directly from SQLite
 */
router.get('/stats/summary', authenticate, (req, res) => {
  const user = req.user;

  if (user.role === 'DEVELOPER') {
    const devId = user.id;
    const totalAssigned = get('SELECT COUNT(*) as count FROM defects WHERE assigned_developer = ?', [devId]).count;
    const inProgress = get("SELECT COUNT(*) as count FROM defects WHERE assigned_developer = ? AND status IN ('OPEN', 'IN_PROGRESS')", [devId]).count;
    const readyForRetest = get("SELECT COUNT(*) as count FROM defects WHERE assigned_developer = ? AND status = 'READY_FOR_RETEST'", [devId]).count;
    const reopened = get("SELECT COUNT(*) as count FROM defects WHERE assigned_developer = ? AND status = 'REOPENED'", [devId]).count;

    return res.json({
      role: 'DEVELOPER',
      totalAssigned,
      inProgress,
      readyForRetest,
      reopened
    });
  }

  // For QA Tester and QA Lead
  const total = get('SELECT COUNT(*) as count FROM defects').count;
  const open = get("SELECT COUNT(*) as count FROM defects WHERE status = 'OPEN'").count;
  const inProgress = get("SELECT COUNT(*) as count FROM defects WHERE status = 'IN_PROGRESS'").count;
  const readyForRetest = get("SELECT COUNT(*) as count FROM defects WHERE status = 'READY_FOR_RETEST'").count;
  const reopened = get("SELECT COUNT(*) as count FROM defects WHERE status = 'REOPENED'").count;
  const pendingClosure = get("SELECT COUNT(*) as count FROM defects WHERE status = 'PENDING_CLOSURE'").count;
  const closed = get("SELECT COUNT(*) as count FROM defects WHERE status = 'CLOSED'").count;

  return res.json({
    role: user.role,
    total,
    open,
    inProgress,
    readyForRetest,
    reopened,
    pendingClosure,
    closed
  });
});

/**
 * GET /api/defects
 * List defects with search, status filter, and role-based filtering
 */
router.get('/', authenticate, (req, res) => {
  const { search, status } = req.query;
  const user = req.user;

  let query = `
    SELECT 
      d.id,
      d.defect_code,
      d.title,
      d.description,
      d.severity,
      d.priority,
      d.module,
      d.steps_to_reproduce,
      d.expected_result,
      d.actual_result,
      d.assigned_developer,
      d.status,
      d.created_by,
      d.created_at,
      u_dev.name as developer_name,
      u_dev.email as developer_email,
      u_creator.name as creator_name,
      (SELECT COUNT(*) FROM retests r WHERE r.defect_id = d.id) as retest_count,
      (SELECT build_version FROM fixes f WHERE f.defect_id = d.id ORDER BY f.created_at DESC LIMIT 1) as latest_build_version
    FROM defects d
    LEFT JOIN users u_dev ON d.assigned_developer = u_dev.id
    LEFT JOIN users u_creator ON d.created_by = u_creator.id
    WHERE 1=1
  `;

  const params = [];

  // Developer role isolation: strictly show only defects assigned to the logged-in developer
  if (user.role === 'DEVELOPER') {
    query += ' AND d.assigned_developer = ?';
    params.push(user.id);
  }

  // Status filtering
  if (status && status !== 'ALL') {
    query += ' AND d.status = ?';
    params.push(status);
  }

  // Search filtering (defect_code, title, module)
  if (search && search.trim() !== '') {
    query += ' AND (d.defect_code LIKE ? OR d.title LIKE ? OR d.module LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY d.id DESC';

  const defects = all(query, params);
  return res.json(defects);
});

/**
 * GET /api/defects/:id
 * Retrieve defect details along with fixes, re-tests, and audit history
 */
router.get('/:id', authenticate, (req, res) => {
  const defectParam = req.params.id;
  const user = req.user;

  const defect = get(`
    SELECT 
      d.*,
      u_dev.name as developer_name,
      u_dev.email as developer_email,
      u_creator.name as creator_name,
      u_creator.email as creator_email
    FROM defects d
    LEFT JOIN users u_dev ON d.assigned_developer = u_dev.id
    LEFT JOIN users u_creator ON d.created_by = u_creator.id
    WHERE d.id = ? OR d.defect_code = ?
  `, [defectParam, defectParam]);

  if (!defect) {
    return res.status(404).json({ error: 'Defect not found.' });
  }

  // Developer permission check: Developers can only view their own assigned defects
  if (user.role === 'DEVELOPER' && defect.assigned_developer !== user.id) {
    return res.status(403).json({ error: 'Access Denied: You are not assigned to this defect.' });
  }

  // Fetch fixes history
  const fixes = all(`
    SELECT 
      f.*,
      u.name as developer_name
    FROM fixes f
    JOIN users u ON f.developer_id = u.id
    WHERE f.defect_id = ?
    ORDER BY f.created_at ASC
  `, [defect.id]);

  // Fetch re-tests history
  const retests = all(`
    SELECT 
      r.*,
      u.name as tester_name
    FROM retests r
    JOIN users u ON r.tester_id = u.id
    WHERE r.defect_id = ?
    ORDER BY r.attempt_number ASC
  `, [defect.id]);

  // Fetch audit log history
  const auditLogs = all(`
    SELECT 
      a.*,
      u.name as user_name,
      u.role as user_role
    FROM audit_logs a
    JOIN users u ON a.user_id = u.id
    WHERE a.defect_id = ?
    ORDER BY a.created_at ASC
  `, [defect.id]);

  return res.json({
    defect,
    fixes,
    retests,
    auditLogs
  });
});

/**
 * POST /api/defects
 * Create a new defect (QA Tester only)
 */
router.post('/', authenticate, requireRoles('QA_TESTER'), (req, res) => {
  const {
    title,
    description,
    module,
    severity,
    priority,
    steps_to_reproduce,
    expected_result,
    actual_result,
    assigned_developer
  } = req.body;

  // Validation
  if (!title || !title.trim()) return res.status(400).json({ error: 'Defect Title is required.' });
  if (!description || !description.trim()) return res.status(400).json({ error: 'Description is required.' });
  if (!module || !module.trim()) return res.status(400).json({ error: 'Module name is required.' });
  if (!severity) return res.status(400).json({ error: 'Severity is required.' });
  if (!priority) return res.status(400).json({ error: 'Priority is required.' });
  if (!steps_to_reproduce || !steps_to_reproduce.trim()) return res.status(400).json({ error: 'Steps to Reproduce are required.' });
  if (!expected_result || !expected_result.trim()) return res.status(400).json({ error: 'Expected Result is required.' });
  if (!actual_result || !actual_result.trim()) return res.status(400).json({ error: 'Actual Result is required.' });
  if (!assigned_developer) return res.status(400).json({ error: 'Please select a developer.' });

  // Validate that assigned_developer is a valid developer
  const developer = get("SELECT id, name FROM users WHERE id = ? AND role = 'DEVELOPER'", [assigned_developer]);
  if (!developer) {
    return res.status(400).json({ error: 'Selected user is not a valid developer.' });
  }

  const defectCode = generateNextDefectCode();

  const insertResult = run(`
    INSERT INTO defects (
      defect_code,
      title,
      description,
      severity,
      priority,
      module,
      steps_to_reproduce,
      expected_result,
      actual_result,
      assigned_developer,
      status,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?)
  `, [
    defectCode,
    title.trim(),
    description.trim(),
    severity,
    priority,
    module.trim(),
    steps_to_reproduce.trim(),
    expected_result.trim(),
    actual_result.trim(),
    developer.id,
    req.user.id
  ]);

  const defectId = insertResult.lastInsertRowid;

  // Log audit entry
  run(`
    INSERT INTO audit_logs (defect_id, user_id, action, description)
    VALUES (?, ?, 'DEFECT_CREATED', ?)
  `, [
    defectId,
    req.user.id,
    `Defect created with status OPEN and assigned to ${developer.name}.`
  ]);

  const createdDefect = get('SELECT * FROM defects WHERE id = ?', [defectId]);

  return res.status(201).json({
    message: `${defectCode} created successfully.`,
    defect: createdDefect
  });
});

module.exports = router;
