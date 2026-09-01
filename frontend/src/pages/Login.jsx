import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bug, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      // Redirect based on role
      switch (loggedInUser.role) {
        case 'QA_TESTER':
          navigate('/qa/dashboard');
          break;
        case 'DEVELOPER':
          navigate('/developer/dashboard');
          break;
        case 'QA_LEAD':
          navigate('/lead/dashboard');
          break;
        default:
          navigate('/login');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <Bug size={28} strokeWidth={2.5} />
          </div>
          <h1 className="login-title">Defect Re-Test Logger</h1>
          <p className="login-subtitle">
            College SE/QA Software Verification & Sign-Off System
          </p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email-input">
              Email Address <span className="required">*</span>
            </label>
            <input
              id="email-input"
              type="email"
              className="form-control"
              placeholder="e.g. qa@test.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              Password <span className="required">*</span>
            </label>
            <input
              id="password-input"
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to System'}
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Demo Credentials Helper for College Viva / Testing */}
        <div className="demo-credentials-box">
          <div className="demo-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="#2563eb" />
            Quick Demo Login Accounts (Click to Fill)
          </div>
          <div className="demo-chips">
            <div
              className="demo-chip"
              onClick={() => fillDemoAccount('qa@test.com', '123456')}
              title="Click to fill QA Tester credentials"
            >
              <span className="demo-chip-role">QA Tester</span>
              <span className="demo-chip-email">qa@test.com (123456)</span>
            </div>
            <div
              className="demo-chip"
              onClick={() => fillDemoAccount('developer@test.com', '123456')}
              title="Click to fill Developer 1 credentials"
            >
              <span className="demo-chip-role" style={{ color: '#7c3aed' }}>Developer 1</span>
              <span className="demo-chip-email">developer@test.com (123456)</span>
            </div>
            <div
              className="demo-chip"
              onClick={() => fillDemoAccount('developer2@test.com', '123456')}
              title="Click to fill Developer 2 credentials"
            >
              <span className="demo-chip-role" style={{ color: '#6d28d9' }}>Developer 2</span>
              <span className="demo-chip-email">developer2@test.com (123456)</span>
            </div>
            <div
              className="demo-chip"
              onClick={() => fillDemoAccount('lead@test.com', '123456')}
              title="Click to fill QA Lead credentials"
            >
              <span className="demo-chip-role" style={{ color: '#059669' }}>QA Lead</span>
              <span className="demo-chip-email">lead@test.com (123456)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
