import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: () => api.get('/projects').then(r => r.data),
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
