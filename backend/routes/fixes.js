const express = require('express');
const router = express.Router();
const { get, run } = require('../database/db');
const { authenticate, requireRoles } = require('../middleware/auth');

/**
 * POST /api/defects/:id/fix
 * Developer submits a fix for an assigned defect
 */
router.post('/:id/fix', authenticate, requireRoles('DEVELOPER'), (req, res) => {
  const defectId = req.params.id;
  const { root_cause, fix_description, build_version } = req.body;

  // Validation
  if (!root_cause || !root_cause.trim()) {
    return res.status(400).json({ error: 'Root Cause is required.' });
  }
  if (!fix_description || !fix_description.trim()) {
    return res.status(400).json({ error: 'Fix Description is required.' });
  }
  if (!build_version || !build_version.trim()) {
    return res.status(400).json({ error: 'Build Version is required.' });
  }

  // Find defect
  const defect = get('SELECT * FROM defects WHERE id = ?', [defectId]);
  if (!defect) {
    return res.status(404).json({ error: 'Defect not found.' });
  }

  // Security check: Developer must be assigned to this defect
  if (defect.assigned_developer !== req.user.id) {
    return res.status(403).json({ error: 'Access Denied: You can only submit fixes for defects assigned to you.' });
  }

  // Insert Fix record
  const fixResult = run(`
    INSERT INTO fixes (defect_id, developer_id, root_cause, fix_description, build_version)
    VALUES (?, ?, ?, ?, ?)
  `, [
    defect.id,
    req.user.id,
    root_cause.trim(),
    fix_description.trim(),
    build_version.trim()
  ]);

  // Update defect status to READY_FOR_RETEST
  run('UPDATE defects SET status = ? WHERE id = ?', ['READY_FOR_RETEST', defect.id]);

  // Insert Audit Log
  run(`
    INSERT INTO audit_logs (defect_id, user_id, action, description)
    VALUES (?, ?, 'FIX_SUBMITTED', ?)
  `, [
    defect.id,
    req.user.id,
    `Developer ${req.user.name} submitted fix for build v${build_version.trim()}. Defect marked as READY_FOR_RETEST.`
  ]);

  const updatedDefect = get('SELECT * FROM defects WHERE id = ?', [defect.id]);
  const createdFix = get('SELECT * FROM fixes WHERE id = ?', [fixResult.lastInsertRowid]);

  return res.status(201).json({
    message: 'Fix submitted successfully. Defect is ready for re-test.',
    defect: updatedDefect,
    fix: createdFix
  });
});

module.exports = router;
