import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const fundingOptions = ['DONOR', 'GOVERNMENT', 'INTERNAL'];

export default function NewProjectPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userDivision = user?.division;

  const [divisions, setDivisions] = useState([]);
  const [form, setForm] = useState({
    title: '',
    divisionId: userDivision ? userDivision.id : '',
    fundingType: '',
    researchArea: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
  });
  const [errors, setErrors] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // Fetch divisions from API on mount
  useEffect(() => {
    async function fetchDivisions() {
      try {
        const response = await apiClient.get('/divisions');
        setDivisions(response.data.data);
      } catch (err) {
        console.error('Failed to fetch divisions:', err);
      }
    }
    fetchDivisions();
  }, []);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors?.[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return Object.keys(next).length ? next : null;
      });
    }
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    if (!form.divisionId) errs.divisionId = 'Division is required.';
    if (!form.fundingType) errs.fundingType = 'Funding type is required.';
    if (!form.startDate) errs.startDate = 'Start date is required.';
    return Object.keys(errs).length ? errs : null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post('/projects', form);
      navigate(`/projects/${response.data.data.id}`);
    } catch (err) {
      if (err.response && err.response.data) {
        setServerError(err.response.data.message || 'Failed to create project');
      } else {
        setServerError('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '24px' }}>New Project</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px',
            }}
          />
          {errors?.title && (
            <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Division</label>
          <select
            value={form.divisionId}
            onChange={(e) => handleChange('divisionId', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px',
            }}
          >
            <option value="">Select a division</option>
            {divisions.map((division) => (
              <option key={division.id} value={division.id}>
                {division.name}
              </option>
            ))}
          </select>
          {errors?.divisionId && (
            <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.divisionId}
            </p>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Funding Type</label>
          <select
            value={form.fundingType}
            onChange={(e) => handleChange('fundingType', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px',
            }}
          >
            <option value="">Select funding type</option>
            {fundingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors?.fundingType && (
            <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
              {errors.fundingType}
            </p>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Research Area</label>
          <input
            type="text"
            value={form.researchArea}
            onChange={(e) => handleChange('researchArea', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px',
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => handleChange('location', e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              Start Date
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            />
            {errors?.startDate && (
              <p style={{ color: '#ef4444', fontSize: '14px', marginTop: '4px' }}>
                {errors.startDate}
              </p>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
              End Date
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                fontSize: '16px',
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600' }}>
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '16px',
            }}
          />
        </div>

        {serverError && (
          <p style={{ color: '#ef4444', textAlign: 'center', margin: '16px 0' }}>
            {serverError}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              flex: 1,
              padding: '10px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  );
}