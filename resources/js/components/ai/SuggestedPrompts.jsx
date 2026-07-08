const DEFAULT_SUGGESTIONS = [
    'What documents are available?',
    'Show me recent publications',
    'Which projects are researching forest restoration?',
];

export default function SuggestedPrompts({ onSelect }) {
    return (
        <div style={{ padding: '24px 20px' }}>
            <div
                style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#4a5568',
                    marginBottom: '12px',
                    textAlign: 'center',
                }}
            >
                Suggested questions
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                }}
            >
                {DEFAULT_SUGGESTIONS.map((prompt, idx) => (
                    <button
                        key={idx}
                        onClick={() => onSelect && onSelect(prompt)}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            backgroundColor: '#fff',
                            color: '#4a5568',
                            fontSize: '13px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease',
                            lineHeight: 1.4,
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#d69e2e';
                            e.currentTarget.style.backgroundColor = '#fffbeb';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#e2e8f0';
                            e.currentTarget.style.backgroundColor = '#fff';
                        }}
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
}
