import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { ACTIVITY_TYPES } from '../constants';
import { useProjects, useLogActivity } from '../hooks/queries';

export default function LogActivity() {
    const [projectId, setProjectId] = useState('');
    const [activityType, setActivityType] = useState(ACTIVITY_TYPES[0]);
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
    const navigate = useNavigate();

    const { data: projects = [] } = useProjects();
    const { mutate: logActivity, isPending } = useLogActivity();

    const handleSubmit = (e) => {
        e.preventDefault();
        logActivity(
            { projectId: Number(projectId), activityType, description, notes, activityDate },
            {
                onSuccess: () => {
                    toast.success('Activity logged successfully!');
                    setDescription('');
                    setNotes('');
                    setProjectId('');
                    setActivityType(ACTIVITY_TYPES[0]);
                },
                onError: (err) => {
                    toast.error(err?.response?.data?.message || 'Failed to log activity');
                },
            }
        );
    };

    return (
        <div className="app-shell">
            <Navbar />
            <main id="main-content">
                <div className="page">
                    <div className="page-inner">
                        <div className="page-header">
                            <div className="t-title">Log New Activity</div>
                            <div className="t-small">Record your field or lab work against a project</div>
                        </div>

                        <div className="form-card">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label" htmlFor="la-project">Project</label>
                                    <select
                                        id="la-project"
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
                                        <label className="form-label" htmlFor="la-date">Date</label>
                                        <input
                                            id="la-date"
                                            type="date"
                                            className="form-input"
                                            value={activityDate}
                                            onChange={e => setActivityDate(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="la-type">Activity type</label>
                                        <select
                                            id="la-type"
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
                                    <label className="form-label" htmlFor="la-desc">Activity description</label>
                                    <textarea
                                        id="la-desc"
                                        className="form-textarea"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Describe what was done in detail…"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="la-notes">
                                        Notes <span className="form-label-opt">(optional)</span>
                                    </label>
                                    <textarea
                                        id="la-notes"
                                        className="form-textarea form-textarea-sm"
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
                                        <span aria-hidden="true">←</span> Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={isPending}>
                                        {isPending ? 'Saving…' : <>Save Activity <span aria-hidden="true">✓</span></>}
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
