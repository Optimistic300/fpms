import { Inbox as InboxIcon, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { fmtDate } from '../utils/format';
import { useInbox, useMarkRead } from '../hooks/queries';

export default function InboxPage() {
    const { data: items = [], isPending } = useInbox();
    const { mutate: markRead } = useMarkRead();

    const handleDownload = async (item) => {
        if (!item.read) {
            markRead(item.id, {
                onError: () => toast.error('Failed to mark as read'),
            });
        }
        try {
            const response = await api.get(item.document.downloadUrl, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = item.document.fileName;
            link.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Failed to download file');
        }
    };

    if (isPending) return <div className="loading-screen">Loading…</div>;

    const unread = items.filter(i => !i.read).length;

    return (
        <div className="app-shell">
            <Navbar />
            <main id="main-content">
                <div className="page">
                    <div className="page-inner">
                        <div className="page-header">
                            <div className="t-title">Inbox</div>
                            <div className="t-small">Documents forwarded to you</div>
                        </div>

                        <div className="card">
                            <div className="card-header">
                                <span className="card-title">Forwarded documents</span>
                                <span className="t-small">
                                    {unread > 0
                                        ? <><strong className="u-c-slate900 u-ff-display">{unread}</strong> unread</>
                                        : 'All read'}
                                </span>
                            </div>

                            {items.length === 0 ? (
                                <div className="empty-state">
                                    <InboxIcon size={32} className="empty-icon" aria-hidden="true" />
                                    <div className="empty-title">Your inbox is empty</div>
                                    <div className="empty-sub">Documents forwarded to you will appear here</div>
                                </div>
                            ) : (
                                <div className="inbox-list">
                                    {items.map(item => (
                                        <div
                                            key={item.id}
                                            className={`inbox-item${item.read ? '' : ' inbox-item-unread'}`}
                                        >
                                            <div className="inbox-item-top">
                                                <div className="inbox-item-info">
                                                    {!item.read && <span className="unread-dot" aria-label="Unread" />}
                                                    <div>
                                                        <div className="inbox-item-name">{item.document.fileName}</div>
                                                        <div className="inbox-item-meta">
                                                            From <strong>{item.forwardedByName}</strong>
                                                            {item.document.projectTitle && (
                                                                <> · <span className="chip">{item.document.projectTitle.split(' ').slice(0, 3).join(' ')}</span></>
                                                            )}
                                                            <span className="td-mono u-fs-11"> · {fmtDate(item.createdAt)}</span>
                                                        </div>
                                                        {item.message && (
                                                            <div className="inbox-item-message">"{item.message}"</div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                                    {!item.read && (
                                                        <button
                                                            className="btn btn-outline btn-sm"
                                                            onClick={() => markRead(item.id, { onError: () => toast.error('Failed to mark as read') })}
                                                        >
                                                            Mark read
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-outline btn-sm"
                                                        onClick={() => handleDownload(item)}
                                                    >
                                                        <Download size={13} aria-hidden="true" /> Download
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
