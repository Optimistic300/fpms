export default function TypingIndicator() {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '12px 16px',
                backgroundColor: '#f7fafc',
                borderRadius: '16px',
                borderTopLeftRadius: '4px',
                alignSelf: 'flex-start',
                maxWidth: '85%',
            }}
            aria-label="AI assistant is typing"
            role="status"
        >
            {[0, 1, 2].map((dot) => (
                <div
                    key={dot}
                    style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#a0aec0',
                        animation: 'typing-dot 1.4s ease-in-out infinite',
                        animationDelay: `${dot * 0.16}s`,
                    }}
                />
            ))}
            <style>{`
                @keyframes typing-dot {
                    0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
                    30% { opacity: 1; transform: scale(1); }
                }
            `}</style>
        </div>
    );
}
