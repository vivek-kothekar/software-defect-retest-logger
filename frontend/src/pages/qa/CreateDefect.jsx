import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import api from '../../services/api';
import { PlusCircle, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

export const CreateDefect = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    module: '',
    severity: 'High',
    priority: 'P1',
    steps_to_reproduce: '',
    expected_result: '',
    actual_result: '',
    assigned_developer: ''
  });

  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch real developer accounts from SQLite
  useEffect(() => {
    async function loadDevelopers() {
      try {
        const devs = await api.getDevelopers();
        setDevelopers(devs);
        if (devs.length > 0) {
          setFormData((prev) => ({ ...prev, assigned_developer: devs[0].id }));
        }
      } catch (err) {
        setError('Could not load developer accounts from SQLite database.');
      }
    }
    loadDevelopers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Frontend validation
    if (!formData.title.trim()) return setError('Defect Title is required.');
    if (!formData.description.trim()) return setError('Description is required.');
    if (!formData.module.trim()) return setError('Module is required.');
    if (!formData.steps_to_reproduce.trim()) return setError('Steps to Reproduce are required.');
    if (!formData.expected_result.trim()) return setError('Expected Result is required.');
    if (!formData.actual_result.trim()) return setError('Actual Result is required.');
    if (!formData.assigned_developer) return setError('Please select a developer.');

    try {
      setLoading(true);
      const res = await api.createDefect({
        ...formData,
        assigned_developer: parseInt(formData.assigned_developer, 10)
      });
      setSuccess(res.message || 'Defect created successfully.');
      setTimeout(() => {
        navigate('/qa/defects');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to create defect in SQLite database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Report New Defect" />
      <div className="content-container">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle2 size={16} />
              <span>{success}</span>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <PlusCircle size={18} />
                Defect Information Form
              </div>
              <button
                type="button"
                onClick={() => navigate('/qa/defects')}
                className="btn btn-outline btn-sm"
              >
                <ArrowLeft size={14} />
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">
                  Defect Title <span className="required">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Login Button Not Responding on Click"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="module">
                    Module / Feature <span className="required">*</span>
                  </label>
                  <input
                    id="module"
                    name="module"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Authentication, Checkout"
                    value={formData.module}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="severity">
                    Severity <span className="required">*</span>
                  </label>
                  <select
                    id="severity"
                    name="severity"
                    className="form-select"
                    value={formData.severity}
                    onChange={handleChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="priority">
                    Priority <span className="required">*</span>
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    className="form-select"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="P1">P1 (Immediate / Blocker)</option>
                    <option value="P2">P2 (High Priority)</option>
                    <option value="P3">P3 (Medium Priority)</option>
                    <option value="P4">P4 (Low Priority)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="assigned_developer">
                  Assign Developer <span className="required">*</span>
                </label>
                <select
                  id="assigned_developer"
                  name="assigned_developer"
                  className="form-select"
                  value={formData.assigned_developer}
                  onChange={handleChange}
                  required
                >
                  {developers.map((dev) => (
                    <option key={dev.id} value={dev.id}>
                      {dev.name} ({dev.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Defect Description <span className="required">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  rows={3}
                  placeholder="Detailed overview of the issue..."
                  value={formData.description}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="steps_to_reproduce">
                  Steps to Reproduce <span className="required">*</span>
                </label>
                <textarea
                  id="steps_to_reproduce"
                  name="steps_to_reproduce"
                  className="form-control"
                  rows={4}
                  placeholder="1. Navigate to /login&#10;2. Fill valid email and password&#10;3. Click Login"
                  value={formData.steps_to_reproduce}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="expected_result">
                    Expected Result <span className="required">*</span>
                  </label>
                  <textarea
                    id="expected_result"
                    name="expected_result"
                    className="form-control"
                    rows={3}
                    placeholder="What should have happened..."
                    value={formData.expected_result}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="actual_result">
                    Actual Result <span className="required">*</span>
                  </label>
                  <textarea
                    id="actual_result"
                    name="actual_result"
                    className="form-control"
                    rows={3}
                    placeholder="What actually occurred..."
                    value={formData.actual_result}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/qa/defects')}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={loading}
                >
                  <PlusCircle size={16} />
                  {loading ? 'Submitting to SQLite...' : 'Submit Defect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateDefect;
