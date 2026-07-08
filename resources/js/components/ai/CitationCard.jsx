export default function CitationCard({ citation, index, onClick }) {
    return (
        <div
            onClick={() => onClick && onClick()}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '10px 12px',
                marginBottom: '8px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#fff',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            role="button"
            tabIndex={0}
            aria-label={`Citation ${index}: ${citation.title}`}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#d69e2e',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 700,
                    flexShrink: 0,
                }}
            >
                {index}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#2d3748', marginBottom: '2px' }}>
                    {citation.title}
                </div>
                <div style={{ fontSize: '11px', color: '#718096', lineHeight: 1.4 }}>
                    {citation.author && <span>{citation.author}</span>}
                    {citation.author && citation.division && <span> · </span>}
                    {citation.division && <span>{citation.division}</span>}
                </div>
                <div style={{ fontSize: '11px', color: '#a0aec0', marginTop: '2px' }}>
                    {citation.fileType && <span>{citation.fileType}</span>}
                    {citation.fileType && citation.page != null && <span> · </span>}
                    {citation.page != null && <span>p. {citation.page}</span>}
                </div>
            </div>
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a0aec0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginTop: '4px' }}
            >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
        </div>
    );
}
