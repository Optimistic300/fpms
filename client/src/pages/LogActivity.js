import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Navbar from '../components/Navbar';

const ACTIVITY_TYPES = [
    'Field sampling',
    'Lab analysis',
    'Data collection',
    'Community engagement',
    'Reporting',
    'Training',
    'Other',
];

export default function LogActivity() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState('');
    const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/projects')
            .then(res => setProjects(res.data))
            .catch(() => navigate('/'));
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.post('/activities', {
                projectId: Number(projectId),
                activityType,
                description,
                notes,
                activityDate,
            });
            setSuccess('Activity logged successfully!');
            setDescription('');
            setNotes('');
            setProjectId('');
            setActivityType(ACTIVITY_TYPES[0]);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log activity');
        }
    };

    return (
        <div className="app-shell">
            <Navbar />
            <main>
                <div className="page">
                    <div className="page-inner">
                        <div className="page-header">
                            <div className="t-title">Log New Activity</div>
                            <div className="t-small">Record your field or lab work against a project</div>
                        </div>

                        <div className="form-card">
                            {success && <div className="alert alert-success">{success}</div>}
                            {error   && <div className="alert alert-error">{error}</div>}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Project</label>
                                    <select
                                        className="form-select"
                                        value={projectId}
                                        onChange={e => setProjectId(e.target.value)}
                                        required
                                    >
                                        <option value="">Select a project…</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.title}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date</label>
                                        <input
                                            type="date"
                                            className="form-input"
                                            value={activityDate}
                                            onChange={e => setActivityDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Activity type</label>
                                        <select
                                            className="form-select"
                                            value={activityType}
                                            onChange={e => setActivityType(e.target.value)}
                                        >
                                            {ACTIVITY_TYPES.map(t => (
                                                <option key={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Activity description</label>
                                    <textarea
                                        className="form-textarea"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Describe what was done in detail…"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Notes <span className="form-label-opt">(optional)</span>
                                    </label>
                                    <textarea
                                        className="form-textarea"
                                        style={{ minHeight: '70px' }}
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        placeholder="Additional context, observations, or follow-up actions…"
                                    />
                                </div>

                                <div className="btn-group btn-group-between">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        ← Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Save Activity ✓
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
