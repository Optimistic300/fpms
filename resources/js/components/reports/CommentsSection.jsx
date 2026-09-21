import { useState } from 'react';

export default function CommentsSection({ comments = [], onSubmitComment }) {
    const [newComment, setNewComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!newComment.trim() || submitting) return;
        setSubmitting(true);
        try {
            await onSubmitComment(newComment.trim());
            setNewComment('');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#475569', marginBottom: '12px' }}>
                Comments ({comments.length})
            </div>

            {comments.length === 0 && (
                <div style={{ fontSize: '13px', color: '#94a3b8', padding: '12px 0' }}>
                    No comments yet.
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                {comments.map((c, i) => (
                    <div
                        key={c.id || i}
                        style={{
                            padding: '12px',
                            borderRadius: '6px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #e2e8f0',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>
                                {c.user || c.userName || 'User'}
                            </span>
                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                {c.createdAt
                                    ? new Date(c.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })
                                    : ''}
                            </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                            {c.body || c.text || c.comment}
                        </div>
                    </div>
                ))}
            </div>

            {onSubmitComment && (
                <form onSubmit={handleSubmit}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                        placeholder="Add a comment..."
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px',
                            resize: 'vertical',
                            outline: 'none',
                            boxSizing: 'border-box',
                            marginBottom: '8px',
                        }}
                    />
                    <button
                        type="submit"
                        disabled={!newComment.trim() || submitting}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '6px',
                            border: 'none',
                            backgroundColor: !newComment.trim() || submitting ? '#94a3b8' : 'var(--color-primary)',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: !newComment.trim() || submitting ? 'not-allowed' : 'pointer',
                        }}
                    >
                        {submitting ? 'Posting...' : 'Post Comment'}
                    </button>
                </form>
            )}
        </div>
    );
}