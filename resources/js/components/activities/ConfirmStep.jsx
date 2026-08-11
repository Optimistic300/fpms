export default function ConfirmStep({ formData, files, submitting, uploadProgress, fileErrors, onRetry, projects, activityTypes }) {
    const projectName = projects.find((p) => String(p.id) === String(formData.projectId))?.title || formData.projectId;
    const typeName = activityTypes.find((t) => String(t.id) === String(formData.activityTypeId))?.name || formData.activityTypeId;

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    const sectionStyle = { marginBottom: '16px' };
    const labelStyle = { fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' };
    const valueStyle = { fontSize: '14px', color: '#1e293b', margin: 0 };
    const fileRowStyle = {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '6px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', marginBottom: '6px', fontSize: '13px',
    };
    const progressBarOuter = {
        width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', marginTop: '4px',
    };
    const progressBarInner = (pct) => ({
        width: `${pct}%`, height: '100%', backgroundColor: 'var(--color-primary)', borderRadius: '3px', transition: 'width 0.3s',
    });

    return (
        <div>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>
                Review & Confirm
            </h3>

            <div style={sectionStyle}>
                <div style={labelStyle}>Project</div>
                <p style={valueStyle}>{projectName}</p>
            </div>

            <div style={sectionStyle}>
                <div style={labelStyle}>Date</div>
                <p style={valueStyle}>{formData.date}</p>
            </div>

            <div style={sectionStyle}>
                <div style={labelStyle}>Activity Type</div>
                <p style={valueStyle}>{typeName}</p>
            </div>

            <div style={sectionStyle}>
                <div style={labelStyle}>Description</div>
                <p style={valueStyle}>{formData.description}</p>
            </div>

            {formData.notes && (
                <div style={sectionStyle}>
                    <div style={labelStyle}>Notes</div>
                    <p style={valueStyle}>{formData.notes}</p>
                </div>
            )}

            <div style={sectionStyle}>
                <div style={labelStyle}>Files ({files.length})</div>
                {files.length === 0 ? (
                    <p style={{ ...valueStyle, color: '#94a3b8' }}>No files attached</p>
                ) : (
                    files.map((file, i) => {
                        const prog = uploadProgress[i] ?? (submitting ? 0 : undefined);
                        const err = fileErrors[i];
                        return (
                            <div key={i} style={fileRowStyle}>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {file.name}
                                </span>
                                <span style={{ color: '#64748b', whiteSpace: 'nowrap' }}>
                                    {formatSize(file.size)}
                                </span>
                                {submitting && prog !== undefined && (
                                    <div style={{ width: '80px' }}>
                                        <div style={progressBarOuter}>
                                            <div style={progressBarInner(prog)} />
                                        </div>
                                    </div>
                                )}
                                {err && (
                                    <button
                                        type="button"
                                        onClick={() => onRetry(i)}
                                        style={{
                                            padding: '3px 10px', fontSize: '12px', fontWeight: 500,
                                            color: '#dc2626', backgroundColor: '#fef2f2',
                                            border: '1px solid #fecaca', borderRadius: '4px',
                                            cursor: 'pointer', fontFamily: 'inherit',
                                        }}
                                    >
                                        Retry
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
