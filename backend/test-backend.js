// Backend verification script
const http = require('http');

async function request(options, data = null) {
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
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING BACKEND INTEGRATION & SECURITY TESTS ---');

  // 1. Health check
  const health = await request({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('1. Health Check:', health.status === 200 ? 'PASSED' : 'FAILED', health.data);

  // 2. Login as QA Tester
  const qaLogin = await request({
    host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'qa@test.com', password: '123456' });
  console.log('2. QA Tester Login:', qaLogin.status === 200 ? 'PASSED' : 'FAILED', qaLogin.data.user?.role);
  const qaToken = qaLogin.data.token;

  // 3. Login as Developer 1
  const dev1Login = await request({
    host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'developer@test.com', password: '123456' });
  console.log('3. Dev 1 Login:', dev1Login.status === 200 ? 'PASSED' : 'FAILED', dev1Login.data.user?.name);
  const dev1Token = dev1Login.data.token;
  const dev1Id = dev1Login.data.user.id;

  // 4. Login as Developer 2
  const dev2Login = await request({
    host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'developer2@test.com', password: '123456' });
  console.log('4. Dev 2 Login:', dev2Login.status === 200 ? 'PASSED' : 'FAILED', dev2Login.data.user?.name);
  const dev2Token = dev2Login.data.token;

  // 5. Login as QA Lead
  const leadLogin = await request({
    host: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'lead@test.com', password: '123456' });
  console.log('5. QA Lead Login:', leadLogin.status === 200 ? 'PASSED' : 'FAILED', leadLogin.data.user?.role);
  const leadToken = leadLogin.data.token;

  // 6. QA Tester creates BUG-1001 assigned to Developer 1
  const createRes = await request({
    host: 'localhost', port: 5000, path: '/api/defects', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${qaToken}` }
  }, {
    title: 'Login Button Not Responding',
    description: 'Clicking the Login button after entering credentials produces no visual feedback or network request.',
    module: 'Authentication',
    severity: 'High',
    priority: 'P1',
    steps_to_reproduce: '1. Navigate to /login\n2. Enter valid credentials\n3. Click Login',
    expected_result: 'User is authenticated and redirected to role dashboard',
    actual_result: 'Button remains static and no login request is dispatched',
    assigned_developer: dev1Id
  });
  console.log('6. Defect Creation:', createRes.status === 201 ? 'PASSED' : 'FAILED', createRes.data.message);
  const bug = createRes.data.defect;

  // 7. Developer 2 tries to view Developer 1's defect -> should be 403 Forbidden
  const dev2Access = await request({
    host: 'localhost', port: 5000, path: `/api/defects/${bug.id}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${dev2Token}` }
  });
  console.log('7. Developer 2 Unauthorized Isolation Check:', dev2Access.status === 403 ? 'PASSED (403 Forbidden)' : 'FAILED', dev2Access.data);

  // 8. Developer 1 views assigned defects
  const dev1List = await request({
    host: 'localhost', port: 5000, path: '/api/defects', method: 'GET',
    headers: { 'Authorization': `Bearer ${dev1Token}` }
  });
  const dev1HasBug = dev1List.data.some(d => d.id === bug.id);
  console.log('8. Developer 1 Assigned Defects Listing:', dev1HasBug ? 'PASSED' : 'FAILED');

  // 9. Developer 1 submits fix #1
  const fix1Res = await request({
    host: 'localhost', port: 5000, path: `/api/defects/${bug.id}/fix`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dev1Token}` }
  }, {
    root_cause: 'Incorrect button state handling and disabled prop stuck on true.',
    fix_description: 'Corrected login button state handling and enabled click listener.',
    build_version: '1.0.1'
  });
  console.log('9. Dev 1 Submit Fix #1:', fix1Res.status === 201 ? 'PASSED' : 'FAILED', 'New status:', fix1Res.data.defect?.status);

  // 10. QA Tester Re-Test Attempt #1 with FAIL
  const retest1Res = await request({
    host: 'localhost', port: 5000, path: `/api/defects/${bug.id}/retest`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${qaToken}` }
  }, {
    result: 'FAIL',
    comments: 'Issue still reproducible on Safari / Firefox browsers.',
    environment: 'Staging Build v1.0.1'
  });
  console.log('10. QA Re-Test Attempt #1 (FAIL -> REOPENED):', retest1Res.status === 201 && retest1Res.data.defect?.status === 'REOPENED' ? 'PASSED' : 'FAILED', 'Attempt #:', retest1Res.data.retest?.attempt_number);

  // 11. Developer 1 submits fix #2
  const fix2Res = await request({
    host: 'localhost', port: 5000, path: `/api/defects/${bug.id}/fix`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${dev1Token}` }
  }, {
    root_cause: 'Cross-browser event propagation issue resolved in button handler.',
    fix_description: 'Applied universal pointer event fix across all supported browsers.',
    build_version: '1.0.2'
  });
  console.log('11. Dev 1 Submit Fix #2:', fix2Res.status === 201 ? 'PASSED' : 'FAILED', 'New status:', fix2Res.data.defect?.status);

  // 12. QA Tester Re-Test Attempt #2 with PASS
  const retest2Res = await request({
    host: 'localhost', port: 5000, path: `/api/defects/${bug.id}/retest`, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${qaToken}` }
  }, {
    result: 'PASS',
    comments: 'Verified fix across Chrome, Safari, and Firefox. Button responsive and submits cleanly.',
    environment: 'Staging Build v1.0.2'
  });
  console.log('12. QA Re-Test Attempt #2 (PASS -> PENDING_CLOSURE):', retest2Res.status === 201 && retest2Res.data.defect?.status === 'PENDING_CLOSURE' ? 'PASSED' : 'FAILED', 'Attempt #:', retest2Res.data.retest?.attempt_number);

  // 13. QA Tester tries to approve closure -> should be 403 Forbidden
  const qaClosureAttempt = await request({
    host: 'localhost', port: 5000, path: `/api/defects/${bug.id}/approve-closure`, method: 'POST',
    headers: { 'Authorization': `Bearer ${qaToken}` }
  });
  console.log('13. QA Tester Unauthorized Closure Attempt:', qaClosureAttempt.status === 403 ? 'PASSED (403 Forbidden)' : 'FAILED');

  // 14. QA Lead approves closure
  const leadClosure = await request({
    host: 'localhost', port: 5000, path: `/api/defects/${bug.id}/approve-closure`, method: 'POST',
    headers: { 'Authorization': `Bearer ${leadToken}` }
  });
  console.log('14. QA Lead Closure Sign-Off:', leadClosure.status === 200 && leadClosure.data.defect?.status === 'CLOSED' ? 'PASSED (CLOSED)' : 'FAILED');

  // 15. Verify Defect Details & Audit Trail
  const details = await request({
    host: 'localhost', port: 5000, path: `/api/defects/${bug.id}`, method: 'GET',
    headers: { 'Authorization': `Bearer ${qaToken}` }
  });
  console.log('15. Defect Details Verification:', details.status === 200 ? 'PASSED' : 'FAILED');
  console.log('    Status:', details.data.defect?.status);
  console.log('    Total Fixes in SQLite:', details.data.fixes?.length);
  console.log('    Total Retests in SQLite:', details.data.retests?.length);
  console.log('    Total Audit Logs in SQLite:', details.data.auditLogs?.length);

  console.log('--- ALL BACKEND CORE WORKFLOW & ROLE ISOLATION TESTS COMPLETE ---');
}

// Start backend temporarily in child process and run test
const { spawn } = require('child_process');
const serverProc = spawn('node', ['server.js'], { cwd: __dirname });

serverProc.stdout.on('data', async (d) => {
  const text = d.toString();
  if (text.includes('running on port 5000')) {
    try {
      await runTests();
    } catch (e) {
      console.error('Test execution error:', e);
    } finally {
      serverProc.kill();
      process.exit(0);
    }
  }
});
