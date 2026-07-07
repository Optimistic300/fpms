const DRAFT_PREFIX = 'skms-draft-';

export function saveDraft(draftId, data) {
    try {
        localStorage.setItem(`${DRAFT_PREFIX}${draftId}`, JSON.stringify(data));
        return true;
    } catch {
        return false;
    }
}

export function getDraft(draftId) {
    try {
        const raw = localStorage.getItem(`${DRAFT_PREFIX}${draftId}`);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function clearDraft(draftId) {
    try {
        localStorage.removeItem(`${DRAFT_PREFIX}${draftId}`);
        return true;
    } catch {
        return false;
    }
}

export function getAllDraftKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(DRAFT_PREFIX)) {
            keys.push(key.replace(DRAFT_PREFIX, ''));
        }
    }
    return keys;
}
