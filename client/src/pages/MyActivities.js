import { useState } from 'react';
import { ClipboardList, Paperclip, X, BookOpen, Send, Download, ChevronDown, ChevronUp, Check, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ForwardModal from '../components/ForwardModal';
import { fmtDate } from '../utils/format';
import { ACTIVITY_TYPES } from '../constants';
import { useMyActivities, useDeleteDocument, usePublishDocument, useUpdateActivity, useDeleteActivity } from '../hooks/queries';
import { useAuth } from '../context/AuthContext';

function fileLabel(fileType) {
    if (!fileType) return 'FILE';
    const ext = fileType.split('/')[1] || fileType;
    const map = {
        'pdf': 'PDF',
        'vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'msword': 'DOC',
        'vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
        'csv': 'CSV',
        'png': 'PNG',
        'jpeg': 'JPG',
    };
    return map[ext] || ext.toUpperCase().slice(0, 4);
}

async function downloadFile(docId, fileName) {
    try {
        const response = await api.get(`/documents/download/${docId}`, { responseType: 'blob' });
        const url = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    } catch {
        toast.error('Failed to download file');
    }
}

export default function MyActivities() {
    const [expandedId, setExpandedId]     = useState(null);
    const [editingActivity, setEditingActivity] = useState(null);
    const { data: activities = [], isPending } = useMyActivities();
    const { mutate: deleteDocument }           = useDeleteDocument();
    const { mutate: deleteActivity }           = useDeleteActivity();

    const handleDeleteDoc = (docId) => {
        deleteDocument(docId, {
            onSuccess: () => toast.success('Document removed'),
            onError:   () => toast.error('Failed to remove document'),
        });
    };

    const handleDeleteActivity = (a) => {
        if (!window.confirm(`Delete this activity? This will also remove all attached documents.`)) return;
        deleteActivity(a.id, {
            onSuccess: () => { toast.success('Activity deleted'); setExpandedId(null); },
            onError:   () => toast.error('Failed to delete activity'),
        });
    };

    if (isPending) return <div className="loading-screen">Loading…</div>;

    return (
        <div className="app-shell">
            <Navbar />
            <main id="main-content">
                <div className="page">
                    <div className="page-inner">
                        <div className="page-header">
                            <div className="t-title">My Activities</div>
                            <div className="t-small">All activities logged by you across projects</div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Activity log</span>
                                <span className="t-small">
                                    <strong className="u-c-slate900 u-ff-display">
                                        {activities.length}
                                    </strong>
                                    {' '}entries
                                </span>
                            </div>

                            {/* Desktop table */}
                            <div className="desktop-table">
                                <div className="table-wrap">
                                    <table>
                                        <caption className="sr-only">Activity log</caption>
                                        <thead>
                                            <tr>
                                                <th scope="col">Date</th>
                                                <th scope="col">Project</th>
                                                <th scope="col">Activity</th>
                                                <th scope="col">Notes</th>
                                                <th scope="col">Files</th>
                                                <th scope="col" className="td-chevron" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {activities.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6">
                                                        <div className="empty-state">
                                                            <ClipboardList size={32} className="empty-icon" aria-hidden="true" />
                                                            <div className="empty-title">No activities yet</div>
                                                            <div className="empty-sub">Start by logging your first activity</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                activities.flatMap(a => {
                                                    const docCount   = (a.documents || []).length;
                                                    const isExpanded = expandedId === a.id;
                                                    const rows = [
                                                        <tr
                                                            key={a.id}
                                                            className={`project-row${isExpanded ? ' expanded' : ''}`}
                                                            onClick={() => setExpandedId(v => v === a.id ? null : a.id)}
                                                        >
                                                            <td className="td-mono u-nowrap">{fmtDate(a.activityDate)}</td>
                                                            <td>
                                                                <span className="chip">
                                                                    {(a.projectTitle || '').split(' ').slice(0, 2).join(' ')}
                                                                </span>
                                                            </td>
                                                            <td className="td-primary u-fw-400 u-max-w-280">{a.description}</td>
                                                            <td className="td-secondary">{a.notes || '—'}</td>
                                                            <td>
                                                                {docCount > 0
                                                                    ? <span className="doc-count-badge">{docCount} file{docCount > 1 ? 's' : ''}</span>
                                                                    : <span className="td-secondary">—</span>}
                                                            </td>
                                                            <td className="td-chevron">
                                                                {isExpanded
                                                                    ? <ChevronUp size={14} aria-hidden="true" />
                                                                    : <ChevronDown size={14} aria-hidden="true" />}
                                                            </td>
                                                        </tr>
                                                    ];
                                                    if (isExpanded) {
                                                        rows.push(
                                                            <tr key={`${a.id}-x`} className="expand-row">
                                                                <td colSpan="6">
                                                                    <DocExpandPanel
                                                                        activity={a}
                                                                        docs={a.documents || []}
                                                                        onDeleteDoc={handleDeleteDoc}
                                                                        onEditActivity={() => setEditingActivity(a)}
                                                                        onDeleteActivity={() => handleDeleteActivity(a)}
                                                                    />
                                                                </td>
                                                            </tr>
                                                        );
                                                    }
                                                    return rows;
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Mobile card rows */}
                            <div className="mobile-rows">
                                {activities.length === 0 ? (
                                    <div className="empty-state">
                                        <ClipboardList size={32} className="empty-icon" aria-hidden="true" />
                                        <div className="empty-title">No activities yet</div>
                                        <div className="empty-sub">Start by logging your first activity</div>
                                    </div>
                                ) : (
                                    activities.map(a => {
                                        const docCount   = (a.documents || []).length;
                                        const isExpanded = expandedId === a.id;
                                        return (
                                            <div key={a.id}>
                                                <div
                                                    className={`mobile-row${isExpanded ? ' expanded' : ''}`}
                                                    onClick={() => setExpandedId(v => v === a.id ? null : a.id)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="mobile-row-top">
                                                        <div className="u-flex-1 u-min-w-0">
                                                            <div className="mobile-row-name u-fs-14 u-fw-400">{a.description}</div>
                                                        </div>
                                                        <span className="chip">
                                                            {(a.projectTitle || '').split(' ').slice(0, 2).join(' ')}
                                                        </span>
                                                    </div>
                                                    <div className="mobile-row-meta">
                                                        <span className="td-mono u-fs-11">{fmtDate(a.activityDate)}</span>
                                                        {a.notes && <span className="td-secondary u-fs-11">{a.notes}</span>}
                                                        {docCount > 0 && (
                                                            <span className="doc-count-badge">{docCount} file{docCount > 1 ? 's' : ''}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {isExpanded && (
                                                    <DocExpandPanel
                                                        activity={a}
                                                        docs={a.documents || []}
                                                        onDeleteDoc={handleDeleteDoc}
                                                        onEditActivity={() => setEditingActivity(a)}
                                                        onDeleteActivity={() => handleDeleteActivity(a)}
                                                        mobile
                                                    />
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            {editingActivity && (
                <EditActivityModal
                    activity={editingActivity}
                    onClose={() => setEditingActivity(null)}
                />
            )}
        </div>
    );
}

function DocExpandPanel({ activity, docs, onDeleteDoc, onEditActivity, onDeleteActivity, mobile }) {
    const [forwardDoc, setForwardDoc] = useState(null);
    const { user }                    = useAuth();
    const {
        mutate: publishDoc,
        isPending: isPublishing,
        variables: publishingDocId,
    } = usePublishDocument();

    const handlePublish = (docId) => {
        publishDoc(docId, {
            onSuccess: () => toast.success('Published to library'),
            onError:   () => toast.error('Failed to publish document'),
        });
    };

    return (
        <div className={mobile ? 'expand-panel-mobile' : 'expand-panel'}>
            {docs.length === 0 ? (
                <span className="td-secondary">No documents attached.</span>
            ) : (
                <div className="doc-expand-grid">
                    {docs.map(doc => {
                        const canPublish = !doc.libraryItem &&
                            (doc.uploaderName === user?.fullName || user?.role === 'MANAGEMENT');
                        const thisPublishing = isPublishing && publishingDocId === doc.id;

                        return (
                            <div key={doc.id} className="doc-expand-item">
                                <div className="doc-expand-name">
                                    <Paperclip size={12} aria-hidden="true" />
                                    <span>{doc.fileName}</span>
                                    <span className={`file-type-chip ${fileChipClass(doc.fileType)}`}>
                                        {fileLabel(doc.fileType)}
                                    </span>
                                </div>
                                <div className="doc-expand-actions">
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => downloadFile(doc.id, doc.fileName)}
                                    >
                                        <Download size={11} aria-hidden="true" /> Download
                                    </button>
                                    {doc.libraryItem ? (
                                        <button className="btn btn-published btn-sm" disabled>
                                            <Check size={11} aria-hidden="true" /> Published
                                        </button>
                                    ) : canPublish ? (
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => handlePublish(doc.id)}
                                            disabled={thisPublishing}
                                            aria-label="Publish to library"
                                        >
                                            <BookOpen size={11} aria-hidden="true" />
                                            {thisPublishing ? ' Publishing…' : ' Publish'}
                                        </button>
                                    ) : null}
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => setForwardDoc(doc)}
                                        aria-label={`Forward ${doc.fileName}`}
                                    >
                                        <Send size={11} aria-hidden="true" />
                                    </button>
                                    <button
                                        className="doc-delete"
                                        onClick={() => onDeleteDoc(doc.id)}
                                        aria-label={`Delete ${doc.fileName}`}
                                    >
                                        <X size={11} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {forwardDoc && (
                <ForwardModal doc={forwardDoc} onClose={() => setForwardDoc(null)} />
            )}
            <div className="expand-actions">
                <button className="btn btn-outline btn-sm" onClick={onEditActivity}>
                    <Pencil size={12} aria-hidden="true" /> Edit Activity
                </button>
                <button className="btn btn-danger btn-sm" onClick={onDeleteActivity}>
                    <Trash2 size={12} aria-hidden="true" /> Delete Activity
                </button>
            </div>
        </div>
    );
}

function fileChipClass(fileType) {
    if (!fileType) return '';
    const t = fileType.split('/')[1] || fileType;
    if (t === 'pdf') return 'ftc-pdf';
    if (t === 'vnd.openxmlformats-officedocument.wordprocessingml.document' || t === 'msword') return 'ftc-docx';
    if (t === 'vnd.openxmlformats-officedocument.spreadsheetml.sheet' || t === 'csv') return 'ftc-xlsx';
    if (fileType.startsWith('image/')) return 'ftc-img';
    return '';
}

function EditActivityModal({ activity, onClose }) {
    const [description, setDescription] = useState(activity.description ?? '');
    const [notes, setNotes]             = useState(activity.notes       ?? '');
    const [activityDate, setDate]       = useState(activity.activityDate ?? '');
    const [activityType, setType]       = useState(activity.activityType ?? '');

    const { mutate: updateActivity, isPending } = useUpdateActivity();

    const handleSubmit = (e) => {
        e.preventDefault();
        updateActivity(
            {
                id: activity.id,
                projectId: 0,        // backend ignores projectId on update
                description,
                notes:        notes        || null,
                activityDate,
                activityType: activityType || null,
            },
            {
                onSuccess: () => { toast.success('Activity updated'); onClose(); },
                onError:   () => toast.error('Failed to update activity'),
            }
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit activity">
                <div className="modal-header">
                    <span className="modal-title">Edit Activity</span>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label" htmlFor="ea-desc">Description</label>
                            <textarea
                                id="ea-desc"
                                className="form-textarea form-textarea-sm"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label" htmlFor="ea-type">
                                    Activity type <span className="form-label-opt">(optional)</span>
                                </label>
                                <select
                                    id="ea-type"
                                    className="form-select"
                                    value={activityType}
                                    onChange={e => setType(e.target.value)}
                                >
                                    <option value="">None</option>
                                    {ACTIVITY_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="ea-date">Date</label>
                                <input
                                    id="ea-date"
                                    type="date"
                                    className="form-input"
                                    value={activityDate}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="ea-notes">
                                Notes <span className="form-label-opt">(optional)</span>
                            </label>
                            <textarea
                                id="ea-notes"
                                className="form-textarea form-textarea-sm"
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Additional notes…"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isPending}>
                            {isPending ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
