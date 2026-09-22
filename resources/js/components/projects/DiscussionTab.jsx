import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/axios';
import CommentsSection from '../shared/CommentsSection';

export default function DiscussionTab({ projectId, selected }) {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchComments = useCallback(async () => {
        try {
            const res = await apiClient.get(`/projects/${projectId}/comments`);
            setComments(res.data.data || []);
        } catch {
            setComments([]);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        if (selected) fetchComments();
    }, [selected, fetchComments]);

    async function handleSubmitComment(body) {
        const res = await apiClient.post(`/projects/${projectId}/comments`, { body });
        setComments((prev) => [...prev, res.data.data]);
    }

    if (loading) return <p style={{ color: '#94a3b8', fontSize: '13px' }}>Loading...</p>;

    return <CommentsSection comments={comments} onSubmitComment={handleSubmitComment} />;
}
