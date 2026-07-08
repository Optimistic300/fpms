export default function PublicationCard({ publication, onEdit, onDelete, user }) {
    const statusConfig = {
        DRAFT: { label: 'Draft', color: '#94a3b8', bg: '#f1f5f9' },
        SUBMITTED: { label: 'Submitted', color: '#b45309', bg: '#fffbeb' },
        IN_REVISION: { label: 'In Revision', color: '#7c3aed', bg: '#f5f3ff' },
        PUBLISHED: { label: 'Published', color: '#16a34a', bg: '#f0fdf4' },
    };

    const cfg = statusConfig[publication.status] || statusConfig.DRAFT;
    const isDraft = publication.status === 'DRAFT';
    const isPublished = publication.status === 'PUBLISHED';
    const isInRevision = publication.status === 'IN_REVISION';
    const isSubmitted = publication.status === 'SUBMITTED';
    const isStudentType = publication.type === 'STUDENT';

    const isOwner = user?.userId === publication.submittedById;
    const canEdit = user?.role !== 'SECRETARY' && user?.role !== 'ADMIN';
    const showActions = canEdit && (isOwner || user?.role === 'MANAGEMENT' || user?.role === 'DIVISION_HEAD');

    const revisionAlert = isInRevision && publication.revisionDueDate ? (() => {
        const now = new Date();
        const due = new Date(publication.revisionDueDate);
        const diffMs = due - now;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 60) {
            const weeks = Math.ceil(diffDays / 7);
            return `Revision due in ${weeks} week${weeks > 1 ? 's' : ''}`;
        }
        return null;
    })() : null;

    const cardStyle = {
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '16px',
        opacity: isDraft ? 0.6 : 1,
        transition: 'opacity 0.15s ease',
    };

    const titleStyle = {
        fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: '0 0 6px',
        lineHeight: 1.4,
    };

    const badgeStyle = {
        display: 'inline-block', padding: '2px 10px', fontSize: '11px', fontWeight: 600,
        backgroundColor: cfg.bg, color: cfg.color, borderRadius: '10px',
        marginLeft: '8px', whiteSpace: 'nowrap',
    };

    const authorsStyle = {
        fontSize: '13px', color: '#64748b', marginBottom: '8px',
    };

    const metaStyle = {
        fontSize: '12px', color: '#94a3b8', marginBottom: '12px',
        display: 'flex', gap: '16px', flexWrap: 'wrap',
    };

    const actionsStyle = {
        display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '12px',
        borderTop: '1px solid #f1f5f9',
    };

    const btnStyle = (color, bg) => ({
        padding: '6px 14px', fontSize: '12px', fontWeight: 500,
        color, backgroundColor: bg, border: `1px solid ${color}20`,
        borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit',
        textDecoration: 'none',
    });

    const alertStyle = {
        padding: '6px 14px', fontSize: '12px', fontWeight: 600,
        color: '#92400e', backgroundColor: '#fef3c7',
        border: '1px solid #fde68a', borderRadius: '6px',
    };

    return (
        <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <h3 style={titleStyle}>
                    {publication.title}
                    <span style={badgeStyle}>{cfg.label}</span>
                </h3>
            </div>

            <div style={authorsStyle}>{publication.authors || 'No authors listed'}</div>

            {isStudentType ? (
                <div style={metaStyle}>
                    <span>Student: {publication.studentName || '—'}</span>
                    <span>Supervisor: {publication.supervisor || '—'}</span>
                    <span>Programme: {publication.degreeProgramme || '—'}</span>
                </div>
            ) : (
                <div style={metaStyle}>
                    <span>{publication.journalName || 'No journal'}</span>
                    {publication.submittedAt && (
                        <span>{new Date(publication.submittedAt).toLocaleDateString()}</span>
                    )}
                    {publication.linkedProject && (
                        <span>Project: {publication.linkedProject.title}</span>
                    )}
                </div>
            )}

            {isInRevision && publication.submissionDate && (
                <div style={metaStyle}>
                    <span>R&R received: {new Date(publication.submissionDate).toLocaleDateString()}</span>
                    {publication.revisionDueDate && (
                        <span>Due: {new Date(publication.revisionDueDate).toLocaleDateString()}</span>
                    )}
                </div>
            )}

            {isSubmitted && publication.submissionDate && (
                <div style={metaStyle}>
                    <span>Submitted: {new Date(publication.submissionDate).toLocaleDateString()}</span>
                </div>
            )}

            {revisionAlert && (
                <div style={{ marginBottom: '12px' }}>
                    <span style={alertStyle}>{revisionAlert}</span>
                </div>
            )}

            <div style={actionsStyle}>
                {isPublished && publication.doi && (
                    <a
                        href={`https://doi.org/${publication.doi}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={btnStyle('#2563eb', '#eff6ff')}
                    >
                        DOI
                    </a>
                )}

                {isPublished && publication.manuscriptFilePath && (
                    <button
                        type="button"
                        onClick={() => window.open(`/api/documents/download?path=${encodeURIComponent(publication.manuscriptFilePath)}`, '_blank')}
                        style={btnStyle('#16a34a', '#f0fdf4')}
                    >
                        Download PDF
                    </button>
                )}

                {isSubmitted && publication.manuscriptFilePath && (
                    <button
                        type="button"
                        onClick={() => window.open(`/api/documents/download?path=${encodeURIComponent(publication.manuscriptFilePath)}`, '_blank')}
                        style={btnStyle('#b45309', '#fffbeb')}
                    >
                        View Manuscript
                    </button>
                )}

                {showActions && (
                    <button
                        type="button"
                        onClick={() => onEdit(publication)}
                        style={btnStyle('#2563eb', '#eff6ff')}
                    >
                        {isDraft ? 'Update Record' : 'Edit Record'}
                    </button>
                )}

                {(isSubmitted || isInRevision) && showActions && (
                    <button
                        type="button"
                        onClick={() => onEdit(publication)}
                        style={btnStyle('#7c3aed', '#f5f3ff')}
                    >
                        Update Status
                    </button>
                )}

                {showActions && (
                    <button
                        type="button"
                        onClick={() => onDelete(publication)}
                        style={btnStyle('#dc2626', '#fef2f2')}
                    >
                        Delete
                    </button>
                )}
            </div>
        </div>
    );
}
