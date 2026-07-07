import { useState } from 'react';
import { useAI } from '../../contexts/AIContext';

export default function FloatingAIButton() {
    const { openPanel } = useAI();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={openPanel}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="floating-ai-button"
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: isHovered ? '140px' : '48px',
                height: '48px',
                borderRadius: '24px',
                backgroundColor: '#d69e2e',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: isHovered ? 'flex-start' : 'center',
                padding: isHovered ? '0 16px' : '0',
                boxShadow: '0 4px 12px rgba(214,158,46,0.4)',
                zIndex: 200,
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                gap: '8px',
            }}
            aria-label="Ask SKMS"
        >
            <span style={{ fontSize: '20px', flexShrink: 0 }}>🤖</span>
            {isHovered && (
                <span
                    style={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Ask SKMS
                </span>
            )}
        </button>
    );
}
