export default function HonestLimitsBanner({ text }) {
    return (
        <div
            style={{
                marginTop: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#fffbeb',
                border: '1px solid #fef3c7',
                fontSize: '12px',
                color: '#92400e',
                lineHeight: 1.4,
            }}
            role="note"
            aria-label="AI honesty notice"
        >
            {text || 'The AI assistant searches across all indexed library documents. Always verify important information against original sources.'}
        </div>
    );
}
