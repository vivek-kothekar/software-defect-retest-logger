const express = require('express');
const router = express.Router();
const { get, all, run } = require('../database/db');
const { authenticate, requireRoles } = require('../middleware/auth');

/**
 * GET /api/closures/pending
 * QA Lead view: List defects in PENDING_CLOSURE with latest re-test evidence
 */
router.get('/pending', authenticate, requireRoles('QA_LEAD'), (req, res) => {
  const pending = all(`
    SELECT 
      d.*,
      u_dev.name as developer_name,
      u_dev.email as developer_email,
      r.attempt_number as latest_attempt_number,
      r.result as latest_retest_result,
      r.comments as latest_retest_comments,
      r.environment as latest_retest_env,
      r.created_at as latest_retest_date,
      u_tester.name as tester_name,
      u_tester.email as tester_email,
      (SELECT f.build_version FROM fixes f WHERE f.defect_id = d.id ORDER BY f.created_at DESC LIMIT 1) as latest_build_version
    FROM defects d
    LEFT JOIN users u_dev ON d.assigned_developer = u_dev.id
    LEFT JOIN retests r ON r.id = (
      SELECT r2.id FROM retests r2 
      WHERE r2.defect_id = d.id 
      ORDER BY r2.attempt_number DESC LIMIT 1
    )
    LEFT JOIN users u_tester ON r.tester_id = u_tester.id
    WHERE d.status = 'PENDING_CLOSURE'
    ORDER BY d.id ASC
  `);

  return res.json(pending);
});

/**
 * POST /api/defects/:id/approve-closure
 * QA Lead approves final defect closure after verifying PASS re-test
 */
router.post('/:id/approve-closure', authenticate, requireRoles('QA_LEAD'), (req, res) => {
  const defectId = req.params.id;

  const defect = get('SELECT * FROM defects WHERE id = ?', [defectId]);
  if (!defect) {
    return res.status(404).json({ error: 'Defect not found.' });
  }

  // Verification rule: Backend MUST verify that a successful PASS re-test exists
  const passRetest = get(
    "SELECT * FROM retests WHERE defect_id = ? AND result = 'PASS' ORDER BY attempt_number DESC LIMIT 1",
    [defect.id]
  );

  if (!passRetest) {
    return res.status(400).json({
      error: 'Defect cannot be closed without a successful PASS re-test.'
    });
  }

  // Update status to CLOSED
  run("UPDATE defects SET status = 'CLOSED' WHERE id = ?", [defect.id]);

  // Record in audit log
  run(`
    INSERT INTO audit_logs (defect_id, user_id, action, description)
    VALUES (?, ?, 'DEFECT_CLOSED', ?)
  `, [
    defect.id,
    req.user.id,
    `QA Lead ${req.user.name} approved final closure. Defect successfully CLOSED.`
  ]);

  const closedDefect = get('SELECT * FROM defects WHERE id = ?', [defect.id]);

  return res.json({
    message: 'Defect closed successfully.',
    defect: closedDefect
  });
});

module.exports = router;
