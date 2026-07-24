import { useRef, useCallback } from 'react';

export default function FileUploadZone({ files, onAddFiles, onRemoveFile }) {
    const inputRef = useRef(null);
    const dragCounter = useRef(0);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current = 0;
        const dropped = Array.from(e.dataTransfer.files);
        if (dropped.length) onAddFiles(dropped);
    }, [onAddFiles]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current += 1;
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter.current -= 1;
    }, []);

    function handleClick() {
        inputRef.current?.click();
    }

    function handleInputChange(e) {
        const selected = Array.from(e.target.files);
        if (selected.length) onAddFiles(selected);
        e.target.value = '';
    }

    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    const zoneStyle = {
        border: '2px dashed #cbd5e1',
        borderRadius: '8px',
        padding: '40px 20px',
        textAlign: 'center',
        cursor: 'pointer',
        backgroundColor: '#f8fafc',
        color: '#64748b',
        fontSize: '14px',
        transition: 'border-color 0.2s',
        marginBottom: '16px',
    };

    const listStyle = {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    };

    const itemStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: '#f1f5f9',
        borderRadius: '6px',
        marginBottom: '6px',
        fontSize: '13px',
    };

    const removeBtnStyle = {
        background: 'none',
        border: 'none',
        color: '#ef4444',
        cursor: 'pointer',
        fontSize: '16px',
        padding: '2px 6px',
        fontWeight: 700,
    };

    return (
        <div>
            <div
                style={zoneStyle}
                onClick={handleClick}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                role="button"
                tabIndex={0}
                aria-label="File upload zone"
            >
                <p style={{ margin: 0, fontWeight: 500 }}>Drag & drop files here, or click to browse</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8' }}>
                    PDF, DOC, XLS, images — max 10 MB each
                </p>
            </div>
            <input
                ref={inputRef}
                type="file"
                multiple
                onChange={handleInputChange}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif"
            />

            {files.length > 0 && (
                <ul style={listStyle}>
                    {files.map((file, index) => (
                        <li key={index} style={itemStyle}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name}
                            </span>
                            <span style={{ color: '#64748b', marginLeft: '8px', whiteSpace: 'nowrap' }}>
                                {formatSize(file.size)}
                            </span>
                            <button
                                type="button"
                                style={removeBtnStyle}
                                onClick={() => onRemoveFile(index)}
                                aria-label={`Remove ${file.name}`}
                            >
                                ✕
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
