import { useState } from 'react';
import { useAI } from '../../contexts/AIContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export default function FloatingAIButton() {
    const { openPanel } = useAI();
    const { isOnline } = useOnlineStatus();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <button
            onClick={openPanel}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
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
                zIndex: 1000,
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                gap: '8px',
            }}
            aria-label="Ask FPMS"
        >
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0 }}
            >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {isHovered && (
                <span
                    style={{
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '13px',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Ask FPMS
                </span>
            )}
            {!isOnline && (
                <div
                    style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: '#e53e3e',
                        border: '2px solid #d69e2e',
                    }}
                    aria-label="Offline"
                />
            )}
        </button>
    );
}
