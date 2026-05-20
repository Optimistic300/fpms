import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUsers, useForwardDocument } from '../hooks/queries';
import { useAuth } from '../context/AuthContext';

export default function ForwardModal({ doc, onClose }) {
    const [recipientId, setRecipientId] = useState('');
    const [message, setMessage]         = useState('');
    const { user: me }                  = useAuth();
    const { data: users = [] }          = useUsers();
    const { mutate: forward, isPending } = useForwardDocument();

    const recipients = users.filter(u => u.id !== me?.id);

    const handleSubmit = (e) => {
        e.preventDefault();
        forward(
            { documentId: doc.id, forwardedToUserId: Number(recipientId), message: message || null },
            {
                onSuccess: () => { toast.success('Document forwarded'); onClose(); },
                onError:   () => toast.error('Failed to forward document'),
            }
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={e => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Forward document"
            >
                <div className="modal-header">
                    <span className="modal-title">Forward Document</span>
                    <button className="modal-close" onClick={onClose} aria-label="Close">
                        <X size={16} aria-hidden="true" />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label className="form-label">Document</label>
                            <div className="td-secondary">{doc.fileName}</div>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="fwd-to">Forward to</label>
                            <select
                                id="fwd-to"
                                className="form-select"
                                value={recipientId}
                                onChange={e => setRecipientId(e.target.value)}
                                required
                            >
                                <option value="">Select recipient…</option>
                                {recipients.map(u => (
                                    <option key={u.id} value={u.id}>
                                        {u.fullName}{u.designation ? ` — ${u.designation}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label" htmlFor="fwd-msg">
                                Message <span className="form-label-opt">(optional)</span>
                            </label>
                            <textarea
                                id="fwd-msg"
                                className="form-textarea form-textarea-sm"
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Add a note to the recipient…"
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={isPending}>
                            {isPending ? 'Sending…' : 'Forward'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
