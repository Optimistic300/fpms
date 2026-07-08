import { useState, useEffect, useRef, useCallback } from 'react';
import { useAI } from '../../contexts/AIContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useAiQuestionQueue } from '../../hooks/useAiQuestionQueue';
import axios from '../../services/axios';
import SuggestedPrompts from '../ai/SuggestedPrompts';
import MessageBubble from '../ai/MessageBubble';
import TypingIndicator from '../ai/TypingIndicator';

export default function AIPanel() {
    const { isOpen, closePanel, conversationHistory, setConversationHistory } = useAI();
    const { isOnline } = useOnlineStatus();
    const { submitQuestion, queuedCount } = useAiQuestionQueue();

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [queuedMessage, setQueuedMessage] = useState(null);
    const [showOfflineBanner, setShowOfflineBanner] = useState(false);

    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const panelRef = useRef(null);
    const previousFocusRef = useRef(null);

    const scrollToBottom = useCallback(() => {
        if (typeof messagesEndRef.current?.scrollIntoView === 'function') {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement;
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            previousFocusRef.current?.focus();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [conversationHistory, loading, error, scrollToBottom]);

    useEffect(() => {
        if (!isOnline) {
            setShowOfflineBanner(true);
        } else {
            setShowOfflineBanner(false);
        }
    }, [isOnline]);

    useEffect(() => {
        if (!isOpen) {
            setError(null);
            setQueuedMessage(null);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                closePanel();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, closePanel]);

    const sendMessage = useCallback(async (text) => {
        const trimmed = text.trim();
        if (!trimmed || loading) return;

        const userMessage = { id: Date.now(), role: 'user', content: trimmed };
        const updatedHistory = [...conversationHistory, userMessage];
        setConversationHistory(updatedHistory);
        setInput('');
        setError(null);
        setQueuedMessage(null);

        if (!isOnline) {
            await submitQuestion(trimmed);
            setQueuedMessage('Your question has been saved and will be answered when you reconnect.');
            return;
        }

        const queueResult = await submitQuestion(trimmed);
        if (!queueResult.sent) {
            setQueuedMessage('Your question has been saved and will be answered when you reconnect.');
            return;
        }

        setLoading(true);

        try {
            const apiHistory = updatedHistory.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await axios.post('/ai/query', {
                query: trimmed,
                conversationHistory: apiHistory,
            });

            const result = response.data.data || response.data;

            const assistantMessage = {
                id: Date.now() + 1,
                role: 'assistant',
                content: result.answer || 'I could not find an answer to your question.',
                citations: result.citations || [],
                followUpPrompts: result.followUpPrompts || [],
                canAnswer: result.canAnswer ?? true,
                banner: result.banner || null,
            };

            setConversationHistory([...updatedHistory, assistantMessage]);
        } catch (err) {
            if (err.response?.status === 408 || !err.response) {
                setError('The request timed out. Please try again.');
            } else {
                setError('Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    }, [loading, conversationHistory, isOnline, submitQuestion, setConversationHistory]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(input);
        }
    };

    const handleFollowUpClick = (prompt) => {
        if (prompt) {
            setInput(prompt);
            sendMessage(prompt);
        } else {
            setInput('');
            inputRef.current?.focus();
        }
    };

    const handleSuggestedPrompt = (prompt) => {
        sendMessage(prompt);
    };

    const handleCitationClick = (citation) => {
        if (citation.id) {
            window.open(`/library?preview=${citation.id}`, '_blank');
        }
    };

    const handleNewConversation = () => {
        setConversationHistory([]);
        setError(null);
        setQueuedMessage(null);
        setInput('');
        inputRef.current?.focus();
    };

    const handleRetry = () => {
        const lastUserMsg = [...conversationHistory].reverse().find((m) => m.role === 'user');
        if (lastUserMsg) {
            sendMessage(lastUserMsg.content);
        }
    };

    if (!isOpen) return null;

    const showEmpty = conversationHistory.length === 0 && !loading && !error && !queuedMessage;

    return (
        <>
            <div
                onClick={closePanel}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.18)',
                    zIndex: 1001,
                }}
                aria-hidden="true"
            />
            <div
                ref={panelRef}
                className="ai-panel"
                role="dialog"
                aria-label="AI Assistant panel"
                aria-modal="true"
                style={{
                    position: 'fixed',
                    top: 0,
                    right: 0,
                    width: 'min(420px, 100vw)',
                    height: '100vh',
                    backgroundColor: '#fff',
                    boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
                    zIndex: 1002,
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
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#d69e2e"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <div>
                            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1a365d', margin: 0, lineHeight: 1.2 }}>
                                Ask SKMS
                            </h2>
                            <p style={{ fontSize: '11px', color: '#718096', margin: 0, lineHeight: 1.3, maxWidth: '220px' }}>
                                Searches across all library documents · always cites sources
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {conversationHistory.length > 0 && (
                            <button
                                onClick={handleNewConversation}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#d69e2e',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                }}
                                aria-label="Start new conversation"
                            >
                                New
                            </button>
                        )}
                        <button
                            onClick={closePanel}
                            style={{
                                background: 'none',
                                border: 'none',
                                fontSize: '20px',
                                cursor: 'pointer',
                                color: '#64748b',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                            }}
                            aria-label="Close AI panel"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '16px 20px',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {showEmpty && (
                        <div
                            style={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                            }}
                        >
                            <SuggestedPrompts onSelect={handleSuggestedPrompt} />
                        </div>
                    )}

                    {conversationHistory.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            onCitationClick={handleCitationClick}
                            onFollowUpClick={handleFollowUpClick}
                        />
                    ))}

                    {loading && <TypingIndicator />}

                    {error && (
                        <div
                            style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                backgroundColor: '#fff5f5',
                                border: '1px solid #fed7d7',
                                fontSize: '13px',
                                color: '#c53030',
                                marginTop: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                            role="alert"
                        >
                            <span>{error}</span>
                            <button
                                onClick={handleRetry}
                                style={{
                                    padding: '4px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #c53030',
                                    backgroundColor: 'transparent',
                                    color: '#c53030',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    marginLeft: '12px',
                                    flexShrink: 0,
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {queuedMessage && (
                        <div
                            style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fef3c7',
                                fontSize: '13px',
                                color: '#92400e',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '8px',
                            }}
                            role="status"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d69e2e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>{queuedMessage}</span>
                        </div>
                    )}

                    {showOfflineBanner && conversationHistory.length === 0 && !loading && !error && !queuedMessage && (
                        <div
                            style={{
                                padding: '12px 16px',
                                borderRadius: '8px',
                                backgroundColor: '#fffbeb',
                                border: '1px solid #fef3c7',
                                fontSize: '13px',
                                color: '#92400e',
                                textAlign: 'center',
                            }}
                        >
                            Ask SKMS requires an internet connection. Your questions will be saved and answered when you reconnect.
                        </div>
                    )}

                    {queuedCount > 0 && (
                        <div
                            style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#f7fafc',
                                border: '1px solid #e2e8f0',
                                fontSize: '12px',
                                color: '#4a5568',
                                textAlign: 'center',
                                marginTop: '8px',
                            }}
                        >
                            {queuedCount} question{queuedCount !== 1 ? 's' : ''} queued for when you reconnect
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                <div
                    style={{
                        padding: '12px 20px 16px',
                        borderTop: '1px solid #e2e8f0',
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'flex-end',
                        }}
                    >
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question..."
                            disabled={loading}
                            rows={1}
                            aria-label="Ask a question"
                            style={{
                                flex: 1,
                                padding: '10px 14px',
                                borderRadius: '12px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                fontFamily: 'inherit',
                                resize: 'none',
                                outline: 'none',
                                lineHeight: 1.4,
                                maxHeight: '120px',
                                backgroundColor: loading ? '#f7fafc' : '#fff',
                            }}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                            }}
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={loading || !input.trim()}
                            aria-label="Send question"
                            style={{
                                padding: '10px 16px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: loading || !input.trim() ? '#e2e8f0' : '#d69e2e',
                                color: loading || !input.trim() ? '#a0aec0' : '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loading || !input.trim() ? 'default' : 'pointer',
                                transition: 'background-color 0.15s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                    <div style={{ fontSize: '10px', color: '#a0aec0', marginTop: '4px', textAlign: 'right' }}>
                        Enter to send · Shift+Enter for new line
                    </div>
                </div>
            </div>
        </>
    );
}
