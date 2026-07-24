export default function DocumentPreview({ document, onClose }) {
    const isPdf = document?.type === 'PDF' || document?.fileName?.endsWith('.pdf');
    const previewUrl = `/api/documents/${document.id}/preview`;
    const downloadUrl = `/api/documents/${document.id}/download`;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={() => onClose()}
        >
            <div
                style={{
                    backgroundColor: 'white', borderRadius: '12px', padding: '0',
                    width: '800px', maxWidth: '95vw', maxHeight: '90vh',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
                }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a365d', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {document.title || document.fileName}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
                            <span style={{
                                fontSize: '11px', fontWeight: 600, color: '#2b6cb0',
                                backgroundColor: '#ebf4ff', padding: '1px 6px', borderRadius: '4px',
                            }}>
                                {document.type}
                            </span>
                            <span>{document.uploadedBy || document.author}</span>
                            <span>·</span>
                            <span>{document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString('en-GB') : document.date}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                        <a
                            href={downloadUrl}
                            style={{
                                padding: '6px 12px', fontSize: '12px', fontWeight: 500,
                                color: '#2b6cb0', backgroundColor: 'white',
                                border: '1px solid #bee3f8', borderRadius: '6px',
                                cursor: 'pointer', textDecoration: 'none',
                            }}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Download
                        </a>
                        <button
                            onClick={() => onClose()}
                            style={{
                                padding: '6px 12px', fontSize: '14px', color: '#64748b',
                                background: 'none', border: '1px solid #e2e8f0',
                                borderRadius: '6px', cursor: 'pointer',
                            }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, overflow: 'auto', padding: isPdf ? '0' : '40px 20px' }}>
                    {isPdf ? (
                        <iframe
                            src={previewUrl}
                            title="Document preview"
                            style={{
                                width: '100%', height: '70vh', border: 'none',
                            }}
                        />
                    ) : (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px', color: '#cbd5e0' }}>
                                📄
                            </div>
                            <p style={{ fontSize: '16px', fontWeight: 600, color: '#4a5568', margin: '0 0 8px' }}>
                                Preview not available
                            </p>
                            <p style={{ fontSize: '13px', color: '#a0aec0', margin: '0 0 20px' }}>
                                {document.type === 'DOCX' || document.type === 'XLSX'
                                    ? 'This document type cannot be previewed inline.'
                                    : 'Inline preview is not supported for this file type.'
                                }
                            </p>
                            <a
                                href={downloadUrl}
                                style={{
                                    padding: '10px 24px', fontSize: '14px', fontWeight: 600,
                                    color: 'white', backgroundColor: '#2b6cb0',
                                    border: 'none', borderRadius: '6px', cursor: 'pointer',
                                    textDecoration: 'none', display: 'inline-block',
                                }}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Download to view
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
