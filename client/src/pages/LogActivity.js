import { useState, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Paperclip, X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ACTIVITY_TYPES } from '../constants';
import { useProjects, useLogActivity } from '../hooks/queries';

export default function LogActivity() {
    const [projectId, setProjectId]         = useState('');
    const [activityType, setActivityType]   = useState(ACTIVITY_TYPES[0]);
    const [description, setDescription]     = useState('');
    const [notes, setNotes]                 = useState('');
    const [activityDate, setActivityDate]   = useState(new Date().toISOString().split('T')[0]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [fileStatuses, setFileStatuses]   = useState([]);
    const [uploading, setUploading]         = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const queryClient = useQueryClient();
    const { data: projects = [] } = useProjects();
    const { mutate: logActivity, isPending } = useLogActivity();

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...newFiles]);
        e.target.value = '';
    };

    const removeFile = (index) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        logActivity(
            { projectId: Number(projectId), activityType, description, notes, activityDate },
            {
                onSuccess: async (activity) => {
                    if (selectedFiles.length > 0) {
                        setUploading(true);
                        setFileStatuses(selectedFiles.map(() => 'pending'));
                        for (let i = 0; i < selectedFiles.length; i++) {
                            setFileStatuses(prev => { const n = [...prev]; n[i] = 'uploading'; return n; });
                            try {
                                const formData = new FormData();
                                formData.append('file', selectedFiles[i]);
                                formData.append('activityId', activity.id);
                                await api.post('/documents/upload', formData);
                                setFileStatuses(prev => { const n = [...prev]; n[i] = 'done'; return n; });
                            } catch {
                                setFileStatuses(prev => { const n = [...prev]; n[i] = 'error'; return n; });
                            }
                        }
                        queryClient.invalidateQueries({ queryKey: ['my-activities'] });
                        setUploading(false);
                    }
                    toast.success('Activity logged successfully!');
                    setDescription('');
                    setNotes('');
                    setProjectId('');
                    setActivityType(ACTIVITY_TYPES[0]);
                    setSelectedFiles([]);
                    setFileStatuses([]);
                },
                onError: (err) => {
                    toast.error(err?.response?.data?.message || 'Failed to log activity');
                },
            }
        );
    };

    const isBusy = isPending || uploading;

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

                                <div className="form-group">
                                    <label className="form-label">
                                        Attachments <span className="form-label-opt">(optional)</span>
                                    </label>
                                    <div className="upload-zone">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.docx,.doc,.xlsx,.csv,.png,.jpg,.jpeg"
                                            className="upload-input"
                                            onChange={handleFileChange}
                                            aria-label="Attach files"
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Paperclip size={14} aria-hidden="true" /> Attach files
                                        </button>
                                        <span className="upload-hint">PDF, images, Word, Excel — max 10 MB each</span>
                                    </div>

                                    {selectedFiles.length > 0 && (
                                        <ul className="file-list">
                                            {selectedFiles.map((f, i) => {
                                                const st = fileStatuses[i];
                                                return (
                                                    <li key={i} className="file-item">
                                                        <Paperclip size={12} aria-hidden="true" />
                                                        <span className="file-name">{f.name}</span>
                                                        <span className="file-size">
                                                            {(f.size / 1024).toFixed(0)} KB
                                                        </span>
                                                        {st === 'uploading' && (
                                                            <Loader2 size={11} className="file-status-spin" aria-label="Uploading" />
                                                        )}
                                                        {st === 'done' && (
                                                            <Check size={11} className="file-status-ok" aria-label="Done" />
                                                        )}
                                                        {st === 'error' && (
                                                            <AlertCircle size={11} className="file-status-err" aria-label="Error" />
                                                        )}
                                                        {!st && (
                                                            <button
                                                                type="button"
                                                                className="file-remove"
                                                                onClick={() => removeFile(i)}
                                                                aria-label={`Remove ${f.name}`}
                                                            >
                                                                <X size={12} aria-hidden="true" />
                                                            </button>
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>

                                <div className="btn-group btn-group-between">
                                    <button
                                        type="button"
                                        className="btn btn-outline"
                                        onClick={() => navigate('/dashboard')}
                                    >
                                        <ArrowLeft size={15} aria-hidden="true" /> Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={isBusy}>
                                        {isBusy
                                            ? (uploading ? 'Uploading files…' : 'Saving…')
                                            : <><Check size={15} aria-hidden="true" /> Save Activity</>
                                        }
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
