import { useState } from 'react';
import apiClient from '../../api/axios';

const iconBtn = {
    background: 'none',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    color: '#475569',
    transition: 'all 0.1s',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
};

export default function DocumentActions({ document: doc, onAction }) {
    const [publishing, setPublishing] = useState(false);
    const [forwarding, setForwarding] = useState(false);
    const [confirmPublish, setConfirmPublish] = useState(false);
    const [forwardEmail, setForwardEmail] = useState('');
    const [showForward, setShowForward] = useState(false);

    function handleDownload() {
        if (doc.downloadUrl) {
            window.open(doc.downloadUrl, '_blank');
        }
        if (onAction) onAction('download', doc);
    }

    async function handlePublish() {
        setPublishing(true);
        try {
            await apiClient.patch(`/documents/${doc.id}`, { published: true });
            setConfirmPublish(false);
            if (onAction) onAction('publish', doc);
        } catch {
            // Silently fail
        } finally {
            setPublishing(false);
        }
    }

    async function handleForward(e) {
        e.preventDefault();
        if (!forwardEmail.trim()) return;
        setForwarding(true);
        try {
            await apiClient.post('/inbox/forward', {
                documentId: doc.id,
                email: forwardEmail.trim(),
            });
            setShowForward(false);
            setForwardEmail('');
            if (onAction) onAction('forward', doc);
        } catch {
            // Silently fail
        } finally {
            setForwarding(false);
        }
    }

    return (
        <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
            <button
                type="button"
                style={iconBtn}
                onClick={handleDownload}
                title="Download"
                aria-label="Download document"
            >
                ⬇
            </button>

            {confirmPublish ? (
                <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Publish?</span>
                    <button
                        type="button"
                        onClick={handlePublish}
                        disabled={publishing}
                        style={{
                            ...iconBtn,
                            backgroundColor: '#dbeafe',
                            borderColor: '#93c5fd',
                            color: '#1e40af',
                            cursor: publishing ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {publishing ? '...' : 'Yes'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmPublish(false)}
                        style={iconBtn}
                    >
                        No
                    </button>
                </span>
            ) : (
                <button
                    type="button"
                    style={iconBtn}
                    onClick={() => setConfirmPublish(true)}
                    title="Publish to library"
                    aria-label="Publish document"
                >
                    📤
                </button>
            )}

            {showForward ? (
                <form
                    onSubmit={handleForward}
                    style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}
                >
                    <input
                        type="email"
                        value={forwardEmail}
                        onChange={(e) => setForwardEmail(e.target.value)}
                        placeholder="email@example.com"
                        style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            width: '160px',
                            fontFamily: 'inherit',
                        }}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={forwarding}
                        style={{
                            ...iconBtn,
                            backgroundColor: '#dbeafe',
                            borderColor: '#93c5fd',
                            color: '#1e40af',
                            cursor: forwarding ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {forwarding ? '...' : 'Send'}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowForward(false);
                            setForwardEmail('');
                        }}
                        style={iconBtn}
                    >
                        ✕
                    </button>
                </form>
            ) : (
                <button
                    type="button"
                    style={iconBtn}
                    onClick={() => setShowForward(true)}
                    title="Forward document"
                    aria-label="Forward document"
                >
                    📨
                </button>
            )}
        </span>
    );
}
