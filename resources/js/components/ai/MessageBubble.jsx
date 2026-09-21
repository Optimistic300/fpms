import { useState } from 'react';
import CitationCard from './CitationCard';
import HonestLimitsBanner from './HonestLimitsBanner';

function renderTextWithCitations(text) {
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
        const match = part.match(/\[(\d+)\]/);
        if (match) {
            return (
                <span
                    key={i}
                    className="citation-badge"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#d69e2e',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        margin: '0 2px',
                        verticalAlign: 'middle',
                    }}
                    data-citation={match[1]}
                >
                    {match[1]}
                </span>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

export default function MessageBubble({ message, onCitationClick, onFollowUpClick }) {
    const [expandedCitations, setExpandedCitations] = useState(false);
    const isUser = message.role === 'user';

    const userStyle = {
        alignSelf: 'flex-end',
        backgroundColor: 'var(--color-brand-darker)',
        color: '#fff',
        borderTopRightRadius: '4px',
    };

    const assistantStyle = {
        alignSelf: 'flex-start',
        backgroundColor: '#f7fafc',
        color: '#1a202c',
        borderTopLeftRadius: '4px',
    };

    return (
        <div style={{ marginBottom: '16px', maxWidth: '100%' }}>
            <div
                style={{
                    maxWidth: '85%',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    lineHeight: 1.5,
                    wordBreak: 'break-word',
                    ...(isUser ? userStyle : assistantStyle),
                }}
            >
                {isUser ? (
                    <span style={{ whiteSpace: 'pre-wrap' }}>{message.content}</span>
                ) : (
                    renderTextWithCitations(message.content)
                )}
            </div>

            {!isUser && message.citations && message.citations.length > 0 && (
                <div style={{ marginTop: '8px', marginLeft: '8px' }}>
                    <button
                        onClick={() => setExpandedCitations(!expandedCitations)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#d69e2e',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            padding: '4px 0',
                        }}
                    >
                        {expandedCitations
                            ? `Hide ${message.citations.length} source${message.citations.length > 1 ? 's' : ''}`
                            : `View ${message.citations.length} source${message.citations.length > 1 ? 's' : ''}`}
                    </button>
                    {expandedCitations && (
                        <div style={{ marginTop: '8px' }}>
                            {message.citations.map((citation, idx) => (
                                <CitationCard
                                    key={citation.id || idx}
                                    citation={citation}
                                    index={idx + 1}
                                    onClick={() => onCitationClick && onCitationClick(citation)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!isUser && message.canAnswer === false && (
                <div
                    style={{
                        marginTop: '8px',
                        marginLeft: '8px',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                    }}
                >
                    <button
                        onClick={() => window.location.href = '/library'}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '16px',
                            border: '1px solid #d69e2e',
                            backgroundColor: 'transparent',
                            color: '#d69e2e',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Browse the library
                    </button>
                    <button
                        onClick={() => onFollowUpClick && onFollowUpClick('')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '16px',
                            border: '1px solid #cbd5e0',
                            backgroundColor: 'transparent',
                            color: '#4a5568',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}
                    >
                        Try different terms
                    </button>
                </div>
            )}

            {!isUser && message.followUpPrompts && message.followUpPrompts.length > 0 && (
                <div
                    style={{
                        marginTop: '8px',
                        marginLeft: '8px',
                        display: 'flex',
                        gap: '8px',
                        flexWrap: 'wrap',
                    }}
                >
                    {message.followUpPrompts.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => onFollowUpClick && onFollowUpClick(prompt)}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: '#f7fafc',
                                color: '#4a5568',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {!isUser && message.banner && (
                <HonestLimitsBanner text={message.banner} />
            )}
        </div>
    );
}
