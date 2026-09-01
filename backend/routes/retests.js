const express = require('express');
const router = express.Router();
const { get, all, run } = require('../database/db');
const { authenticate, requireRoles } = require('../middleware/auth');

/**
 * GET /api/retests/queue
 * List defects currently waiting for QA re-test (status = READY_FOR_RETEST)
 */
router.get('/queue', authenticate, requireRoles('QA_TESTER'), (req, res) => {
  const queue = all(`
    SELECT 
      d.*,
      u_dev.name as developer_name,
      u_dev.email as developer_email,
      (SELECT f.build_version FROM fixes f WHERE f.defect_id = d.id ORDER BY f.created_at DESC LIMIT 1) as latest_build_version,
      (SELECT f.fix_description FROM fixes f WHERE f.defect_id = d.id ORDER BY f.created_at DESC LIMIT 1) as latest_fix_description,
      (SELECT f.root_cause FROM fixes f WHERE f.defect_id = d.id ORDER BY f.created_at DESC LIMIT 1) as latest_root_cause,
      (SELECT COUNT(*) FROM retests r WHERE r.defect_id = d.id) as past_attempts
    FROM defects d
    LEFT JOIN users u_dev ON d.assigned_developer = u_dev.id
    WHERE d.status = 'READY_FOR_RETEST'
    ORDER BY d.id ASC
  `);

  return res.json(queue);
});

/**
 * POST /api/defects/:id/retest
 * QA Tester executes and logs a re-test attempt (PASS or FAIL)
 */
router.post('/:id/retest', authenticate, requireRoles('QA_TESTER'), (req, res) => {
  const defectId = req.params.id;
  const { result, comments, environment } = req.body;

  // Validation
  if (!result || !['PASS', 'FAIL'].includes(result.toUpperCase())) {
    return res.status(400).json({ error: 'Result must be either PASS or FAIL.' });
  }
  if (!comments || !comments.trim()) {
    return res.status(400).json({ error: 'Comments are required.' });
  }

  const cleanResult = result.toUpperCase();
  const cleanEnv = environment && environment.trim() ? environment.trim() : 'Staging / QA Env';

  const defect = get('SELECT * FROM defects WHERE id = ?', [defectId]);
  if (!defect) {
    return res.status(404).json({ error: 'Defect not found.' });
  }

  // Calculate next sequential attempt number for this defect
  const prevCount = get('SELECT COUNT(*) as count FROM retests WHERE defect_id = ?', [defect.id]).count;
  const attemptNumber = prevCount + 1;

  // Insert retest record
  const retestResult = run(`
    INSERT INTO retests (defect_id, tester_id, attempt_number, result, environment, comments)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    defect.id,
    req.user.id,
    attemptNumber,
    cleanResult,
    cleanEnv,
    comments.trim()
  ]);

  let nextStatus = '';
  let responseMessage = '';
  let auditAction = '';
  let auditDesc = '';

  if (cleanResult === 'PASS') {
    nextStatus = 'PENDING_CLOSURE';
    responseMessage = 'Re-Test passed. Defect is pending closure approval.';
    auditAction = 'RETEST_PASSED';
    auditDesc = `Re-Test Attempt #${attemptNumber} PASSED by QA Tester ${req.user.name}. Status updated to PENDING_CLOSURE. Notes: "${comments.trim()}"`;
  } else {
    nextStatus = 'REOPENED';
    responseMessage = 'Re-Test failed. Defect has been reopened.';
    auditAction = 'RETEST_FAILED';
    auditDesc = `Re-Test Attempt #${attemptNumber} FAILED by QA Tester ${req.user.name}. Status updated to REOPENED. Notes: "${comments.trim()}"`;
  }

  // Update defect status in SQLite
  run('UPDATE defects SET status = ? WHERE id = ?', [nextStatus, defect.id]);

  // Insert Audit Log in SQLite
  run(`
    INSERT INTO audit_logs (defect_id, user_id, action, description)
    VALUES (?, ?, ?, ?)
  `, [
    defect.id,
    req.user.id,
    auditAction,
    auditDesc
  ]);

  const updatedDefect = get('SELECT * FROM defects WHERE id = ?', [defect.id]);
  const savedRetest = get('SELECT * FROM retests WHERE id = ?', [retestResult.lastInsertRowid]);

  return res.status(201).json({
    message: responseMessage,
    defect: updatedDefect,
    retest: savedRetest
  });
});

module.exports = router;
