import { createContext, useContext, useState, useCallback } from 'react';

const AIContext = createContext(null);

export function AIProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [conversationHistory, setConversationHistory] = useState([]);

    const openPanel = useCallback(() => setIsOpen(true), []);
    const closePanel = useCallback(() => setIsOpen(false), []);

    return (
        <AIContext.Provider
            value={{
                isOpen,
                conversationHistory,
                openPanel,
                closePanel,
                setConversationHistory,
            }}
        >
            {children}
        </AIContext.Provider>
    );
}

export function useAI() {
    const context = useContext(AIContext);
    if (!context) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
}

export default AIContext;
