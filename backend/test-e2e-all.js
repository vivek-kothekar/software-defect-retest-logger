const http = require('http');

function apiCall(options, payload = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (payload) {
      req.write(JSON.stringify(payload));
    }
    req.end();
  });
}

async function runComprehensiveVerification() {
  console.log('\n========================================================================');
  console.log(' SEQA SOFTWARE DEFECT RE-TEST EXECUTION LOGGER — VERIFICATION SUITE');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(` ✅ PASS: ${testName} ${extraInfo ? `(${extraInfo})` : ''}`);
      passed++;
    } else {
      console.error(` ❌ FAIL: ${testName} ${extraInfo ? `(${extraInfo})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Health Check
    const health = await apiCall({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
    assert(health.status === 200 && health.data.status === 'ok', 'API Health Check');

    // 2. Authentication & Error Handling
    const invalidLogin = await apiCall({
      host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'qa@test.com', password: 'wrongpassword' });
    assert(invalidLogin.status === 401, 'Invalid Login Credentials Rejected (401)');

    const qaLogin = await apiCall({
      host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'qa@test.com', password: '123456' });
    assert(qaLogin.status === 200 && qaLogin.data.user.role === 'QA_TESTER', 'QA Tester Login', qaLogin.data.user.email);
    const qaToken = qaLogin.data.token;

    const dev1Login = await apiCall({
      host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'developer@test.com', password: '123456' });
    assert(dev1Login.status === 200 && dev1Login.data.user.role === 'DEVELOPER', 'Developer 1 Login', dev1Login.data.user.email);
    const dev1Token = dev1Login.data.token;
    const dev1Id = dev1Login.data.user.id;

    const dev2Login = await apiCall({
      host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'developer2@test.com', password: '123456' });
    assert(dev2Login.status === 200 && dev2Login.data.user.role === 'DEVELOPER', 'Developer 2 Login', dev2Login.data.user.email);
    const dev2Token = dev2Login.data.token;
    const dev2Id = dev2Login.data.user.id;

    const leadLogin = await apiCall({
      host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: 'lead@test.com', password: '123456' });
    assert(leadLogin.status === 200 && leadLogin.data.user.role === 'QA_LEAD', 'QA Lead Login', leadLogin.data.user.email);
    const leadToken = leadLogin.data.token;

    // 3. Developer Dropdown Retrieval
    const devList = await apiCall({
      host: 'localhost', port: 5000, path: '/api/auth/developers', method: 'GET',
      headers: { 'Authorization': `Bearer ${qaToken}` }
    });
    assert(devList.status === 200 && devList.data.length >= 2, 'SQLite Developers Dropdown Population', `Found ${devList.data.length} devs`);

    // 4. Create Defect (BUG-XXXX)
    const newDefectRes = await apiCall({
      host: 'localhost', port: 5000, path: '/api/defects', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${qaToken}` }
    }, {
      title: 'Checkout Payment Gateway Timeout',
      description: 'Stripe webhook listener fails during order capture, leaving cart in pending state.',
      module: 'Checkout & Payments',
      severity: 'Critical',
      priority: 'P1',
      steps_to_reproduce: '1. Add item to cart\n2. Proceed to checkout\n3. Click Pay Now with 3D Secure card',
      expected_result: 'Order confirmation page displayed with transaction receipt',
      actual_result: 'Gateway times out after 30s with unhandled exception',
      assigned_developer: dev1Id
    });
    assert(newDefectRes.status === 201 && newDefectRes.data.defect.defect_code.startsWith('BUG-'), 'QA Defect Creation & Auto Code Generation', newDefectRes.data.defect.defect_code);
    const createdBug = newDefectRes.data.defect;

    // Also create another defect assigned to Developer 2 to test multi-dev isolation (Requirement 42)
    const bugDev2Res = await apiCall({
      host: 'localhost', port: 5000, path: '/api/defects', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${qaToken}` }
    }, {
      title: 'Dark Mode Theme Persistence Bug',
      description: 'Switching to dark mode resets back to light mode on page refresh.',
      module: 'UI Theme',
      severity: 'Low',
      priority: 'P4',
      steps_to_reproduce: '1. Toggle dark theme\n2. Refresh browser',
      expected_result: 'Dark mode persists',
      actual_result: 'Theme resets to light mode',
      assigned_developer: dev2Id
    });
    const bugDev2 = bugDev2Res.data.defect;

    // 5. Test Multiple Developer Isolation (Requirement 42)
    const dev1Assigned = await apiCall({
      host: 'localhost', port: 5000, path: '/api/defects', method: 'GET',
      headers: { 'Authorization': `Bearer ${dev1Token}` }
    });
    const dev1HasOwn = dev1Assigned.data.some(d => d.id === createdBug.id);
    const dev1HasDev2 = dev1Assigned.data.some(d => d.id === bugDev2.id);
    assert(dev1HasOwn && !dev1HasDev2, 'Developer 1 Isolation (Own visible, Dev 2 hidden)');

    const dev2Assigned = await apiCall({
      host: 'localhost', port: 5000, path: '/api/defects', method: 'GET',
      headers: { 'Authorization': `Bearer ${dev2Token}` }
    });
    const dev2HasOwn = dev2Assigned.data.some(d => d.id === bugDev2.id);
    const dev2HasDev1 = dev2Assigned.data.some(d => d.id === createdBug.id);
    assert(dev2HasOwn && !dev2HasDev1, 'Developer 2 Isolation (Own visible, Dev 1 hidden)');

    // 6. Developer 2 unauthorized access to Dev 1 defect details (403)
    const unauthorizedDetails = await apiCall({
      host: 'localhost', port: 5000, path: `/api/defects/${createdBug.id}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${dev2Token}` }
    });
    assert(unauthorizedDetails.status === 403, 'Cross-Developer Detail Access Blocked (403)');

    // 7. Developer 1 submits Fix #1 (v1.0.1)
    const fix1 = await apiCall({
      host: 'localhost', port: 5000, path: `/api/defects/${createdBug.id}/fix`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dev1Token}` }
    }, {
      root_cause: 'Missing webhook asynchronous event handler and 5s timeout.',
      fix_description: 'Added async ACK response and increased connection timeout to 60s.',
      build_version: '1.0.1'
    });
    assert(fix1.status === 201 && fix1.data.defect.status === 'READY_FOR_RETEST', 'Developer 1 Submits Fix #1 -> READY_FOR_RETEST');

    // 8. QA Re-Test Queue contains defect
    const queue = await apiCall({
      host: 'localhost', port: 5000, path: '/api/retests/queue', method: 'GET',
      headers: { 'Authorization': `Bearer ${qaToken}` }
    });
    const inQueue = queue.data.some(d => d.id === createdBug.id);
    assert(inQueue, 'QA Re-Test Queue Lists READY_FOR_RETEST Defect');

    // 9. Developer cannot execute Re-Test (Role Barrier 403)
    const devRetestAttempt = await apiCall({
      host: 'localhost', port: 5000, path: `/api/defects/${createdBug.id}/retest`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dev1Token}` }
    }, { result: 'PASS', comments: 'Dev testing' });
    assert(devRetestAttempt.status === 403, 'Developer Re-Test Attempt Blocked (403 Forbidden)');

    // 10. QA Tester executes Re-Test Attempt #1 (FAIL -> REOPENED)
    const retest1 = await apiCall({
      host: 'localhost', port: 5000, path: `/api/defects/${createdBug.id}/retest`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${qaToken}` }
    }, {
      result: 'FAIL',
      comments: 'Tested with 3D Secure test card. Gateway timed out intermittently on 2nd attempt.',
      environment: 'Staging QA Build v1.0.1'
    });
    assert(retest1.status === 201 && retest1.data.defect.status === 'REOPENED' && retest1.data.retest.attempt_number === 1,
      'QA Re-Test Attempt #1 (FAIL -> REOPENED, Attempt #1)');

    // 11. Developer 1 submits Fix #2 (v1.0.2)
    const fix2 = await apiCall({
      host: 'localhost', port: 5000, path: `/api/defects/${createdBug.id}/fix`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dev1Token}` }
    }, {
      root_cause: 'Deadlock in idempotency key lock during webhook retry.',
      fix_description: 'Replaced mutex lock with Redis-style atomic token lease.',
      build_version: '1.0.2'
    });
    assert(fix2.status === 201 && fix2.data.defect.status === 'READY_FOR_RETEST', 'Developer 1 Submits Fix #2 -> READY_FOR_RETEST');

    // 12. QA Tester executes Re-Test Attempt #2 (PASS -> PENDING_CLOSURE)
    const retest2 = await apiCall({
      host: 'localhost', port: 5000, path: `/api/defects/${createdBug.id}/retest`, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${qaToken}` }
    }, {
      result: 'PASS',
      comments: 'Executed 10 consecutive checkout transactions across multiple card types. All verified successfully.',
      environment: 'Staging QA Build v1.0.2'
    });
    assert(retest2.status === 201 && retest2.data.defect.status === 'PENDING_CLOSURE' && retest2.data.retest.attempt_number === 2,
      'QA Re-Test Attempt #2 (PASS -> PENDING_CLOSURE, Attempt #2)');

    // 13. QA Tester & Developer cannot approve closure (Role Barrier 403)
    const qaClosure = await apiCall({
      host: 'localhost', port: 5000, path: `/api/defects/${createdBug.id}/approve-closure`, method: 'POST',
      headers: { 'Authorization': `Bearer ${qaToken}` }
    });
    assert(qaClosure.status === 403, 'QA Tester Closure Approval Blocked (403 Forbidden)');

    const devClosure = await apiCall({
      host: 'localhost', port: 5000, path: `/api/defects/${createdBug.id}/approve-closure`, method: 'POST',
      headers: { 'Authorization': `Bearer ${dev1Token}` }
    });
    assert(devClosure.status === 403, 'Developer Closure Approval Blocked (403 Forbidden)');

    // 14. QA Lead views Pending Closure Queue
    const leadQueue = await apiCall({
      host: 'localhost', port: 5000, path: '/api/closures/pending', method: 'GET',
      headers: { 'Authorization': `Bearer ${leadToken}` }
    });
    const inLeadQueue = leadQueue.data.some(d => d.id === createdBug.id && d.latest_retest_result === 'PASS');
    assert(inLeadQueue, 'QA Lead Queue Lists Defect with PASS Re-Test Evidence');

    // 15. QA Lead Approves Final Closure -> CLOSED
    const closureSignoff = await apiCall({
      host: 'localhost', port: 5000, path: `/api/defects/${createdBug.id}/approve-closure`, method: 'POST',
      headers: { 'Authorization': `Bearer ${leadToken}` }
    });
    assert(closureSignoff.status === 200 && closureSignoff.data.defect.status === 'CLOSED', 'QA Lead Closure Sign-Off -> CLOSED');

    // 16. Defect Details, Fixes, Retests, and Audit Log Verification
    const details = await apiCall({
      host: 'localhost', port: 5000, path: `/api/defects/${createdBug.id}`, method: 'GET',
      headers: { 'Authorization': `Bearer ${qaToken}` }
    });
    assert(details.status === 200 && details.data.defect.status === 'CLOSED', 'Defect Final Status is CLOSED in SQLite');
    assert(details.data.fixes.length === 2, 'Fix History Contains 2 Fix Submissions in SQLite');
    assert(details.data.retests.length === 2, 'Re-Test History Contains 2 Attempts (#1 FAIL, #2 PASS) in SQLite');
    assert(details.data.auditLogs.length >= 6, `Complete Audit Log History Recorded (${details.data.auditLogs.length} events) in SQLite`);

    // 17. Search and Filter Tests
    const searchRes = await apiCall({
      host: 'localhost', port: 5000, path: '/api/defects?search=Checkout', method: 'GET',
      headers: { 'Authorization': `Bearer ${qaToken}` }
    });
    assert(searchRes.data.length >= 1 && searchRes.data[0].module.includes('Checkout'), 'Defect Search by Keyword/Module');

    const filterClosed = await apiCall({
      host: 'localhost', port: 5000, path: '/api/defects?status=CLOSED', method: 'GET',
      headers: { 'Authorization': `Bearer ${qaToken}` }
    });
    assert(filterClosed.data.every(d => d.status === 'CLOSED'), 'Defect Status Filter (CLOSED)');

    // 18. Dashboard Statistics from SQLite
    const statsSummary = await apiCall({
      host: 'localhost', port: 5000, path: '/api/defects/stats/summary', method: 'GET',
      headers: { 'Authorization': `Bearer ${qaToken}` }
    });
    assert(statsSummary.status === 200 && typeof statsSummary.data.total === 'number' && statsSummary.data.closed >= 1, 'QA Dashboard Live Metrics from SQLite');

    console.log('\n========================================================================');
    console.log(` RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('========================================================================\n');

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runComprehensiveVerification();
