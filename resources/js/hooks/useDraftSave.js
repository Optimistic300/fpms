import { useState, useCallback, useRef, useEffect } from 'react';
import { saveDraft, getDraft, clearDraft } from '../services/draftStorage';
import { useOnlineStatus } from './useOnlineStatus';

export function useDraftSave(draftId) {
    const { isOnline } = useOnlineStatus();
    const [draftExists, setDraftExists] = useState(!!getDraft(draftId));
    const [lastSaved, setLastSaved] = useState(null);
    const timerRef = useRef(null);

    const save = useCallback((data) => {
        saveDraft(draftId, { data, savedAt: Date.now() });
        setDraftExists(true);
        setLastSaved(new Date());
    }, [draftId]);

    const restore = useCallback(() => {
        const draft = getDraft(draftId);
        return draft ? draft.data : null;
    }, [draftId]);

    const clear = useCallback(() => {
        clearDraft(draftId);
        setDraftExists(false);
        setLastSaved(null);
    }, [draftId]);

    const autoSave = useCallback((data) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            save(data);
        }, 500);
    }, [save]);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return { save, restore, clear, autoSave, draftExists, lastSaved, isOnline };
}
