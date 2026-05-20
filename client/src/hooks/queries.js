import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get('/projects').then(r => r.data),
    });
}

export function useDivisions() {
    return useQuery({
        queryKey: ['divisions'],
        queryFn: () => api.get('/divisions').then(r => r.data),
    });
}

export function useUsers() {
    return useQuery({
        queryKey: ['users'],
        queryFn: () => api.get('/users').then(r => r.data),
    });
}

export function useMyActivities() {
    return useQuery({
        queryKey: ['my-activities'],
        queryFn: () => api.get('/activities/mine').then(r => r.data),
    });
}

export function useReport(params) {
    return useQuery({
        queryKey: ['report', params],
        queryFn: () => api.get('/activities/report', { params }).then(r => r.data),
        enabled: !!params,
    });
}

export function useLogActivity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/activities', data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['my-activities'] });
        },
    });
}

export function useCreateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => api.post('/projects', data).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    });
}

export function useUpdateProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) => api.put(`/projects/${id}`, data).then(r => r.data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    });
}

export function useDeleteProject() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/projects/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
    });
}

export function useUpdateActivity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }) => api.put(`/activities/${id}`, data).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-activities'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useDeleteActivity() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => api.delete(`/activities/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-activities'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
        },
    });
}

export function useDeleteDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (documentId) => api.delete(`/documents/${documentId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-activities'] });
            queryClient.invalidateQueries({ queryKey: ['library'] });
        },
    });
}

export function usePublishDocument() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (documentId) => api.put(`/documents/${documentId}/publish`).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-activities'] });
            queryClient.invalidateQueries({ queryKey: ['library'] });
        },
    });
}

export function useForwardDocument() {
    return useMutation({
        mutationFn: ({ documentId, forwardedToUserId, message }) =>
            api.post(`/documents/${documentId}/forward`, { forwardedToUserId, message }).then(r => r.data),
    });
}

export function useInbox() {
    return useQuery({
        queryKey: ['inbox'],
        queryFn: () => api.get('/forwards/inbox').then(r => r.data),
    });
}

export function useInboxCount() {
    return useQuery({
        queryKey: ['inbox-count'],
        queryFn: () => api.get('/forwards/inbox/count').then(r => r.data.count),
        refetchInterval: 60000,
    });
}

export function useMarkRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (forwardId) => api.put(`/forwards/${forwardId}/read`).then(r => r.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inbox'] });
            queryClient.invalidateQueries({ queryKey: ['inbox-count'] });
        },
    });
}

export function useLibrary(params) {
    return useQuery({
        queryKey: ['library', params],
        queryFn: () => api.get('/library', { params }).then(r => r.data),
    });
}

export function useLibrarySearch() {
    return useMutation({
        mutationFn: (query) => api.post('/library/search', { query }).then(r => r.data),
    });
}

export function useLibraryStats() {
    return useQuery({
        queryKey: ['library-stats'],
        queryFn: () => api.get('/library/stats').then(r => r.data),
    });
}
