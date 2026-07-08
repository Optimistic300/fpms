import FileUploadZone from './FileUploadZone';

export default function FileAttachStep({ files, onAddFiles, onRemoveFile }) {
    const hintStyle = {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '13px',
        marginTop: '8px',
    };

    return (
        <div>
            <FileUploadZone
                files={files}
                onAddFiles={onAddFiles}
                onRemoveFile={onRemoveFile}
            />
            <p style={hintStyle}>
                You can skip this step and attach files later from the activity detail page.
            </p>
        </div>
    );
}
