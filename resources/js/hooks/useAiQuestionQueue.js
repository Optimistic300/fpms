import { useState, useCallback, useEffect } from 'react';
import { enqueueAiQuestion, getAiQuestions, processAiQueue } from '../services/offlineQueue';
import { useOnlineStatus } from './useOnlineStatus';
import axios from '../api/axios';

export function useAiQuestionQueue() {
    const { isOnline } = useOnlineStatus();
    const [queuedCount, setQueuedCount] = useState(0);

    useEffect(() => {
        getAiQuestions().then((questions) => {
            setQueuedCount(questions.length);
        });
    }, []);

    useEffect(() => {
        if (isOnline && queuedCount > 0) {
            processAiQueue(axios).then((result) => {
                if (result.processed > 0) {
                    setQueuedCount((prev) => Math.max(0, prev - result.processed));
                }
            });
        }
    }, [isOnline]);

    const submitQuestion = useCallback(async (question) => {
        if (isOnline) {
            return { sent: true };
        }
        await enqueueAiQuestion(question);
        setQueuedCount((prev) => prev + 1);
        return { sent: false, queued: true };
    }, [isOnline]);

    return { submitQuestion, queuedCount };
}
