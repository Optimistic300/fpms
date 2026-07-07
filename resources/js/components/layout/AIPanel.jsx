import { useAI } from '../../contexts/AIContext';

export default function AIPanel() {
    const { isOpen, closePanel } = useAI();

    if (!isOpen) return null;

    return (
        <>
            <div
                onClick={closePanel}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.18)',
                    zIndex: 300,
                }}
            />
            <div
                className="ai-panel"
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: '380px',
                    height: '100vh',
                    backgroundColor: 'white',
                    boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
                    zIndex: 301,
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '16px 20px',
                        borderBottom: '1px solid #e2e8f0',
                    }}
                >
                    <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1a365d' }}>
                        Ask SKMS
                    </h2>
                    <button
                        onClick={closePanel}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '20px',
                            cursor: 'pointer',
                            color: '#64748b',
                        }}
                        aria-label="Close AI panel"
                    >
                        ✕
                    </button>
                </div>
                <div
                    style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#94a3b8',
                        fontSize: '14px',
                        padding: '24px',
                        textAlign: 'center',
                    }}
                >
                    Coming soon
                </div>
            </div>
        </>
    );
}
