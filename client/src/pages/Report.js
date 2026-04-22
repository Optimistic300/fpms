import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Report() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState(new Date().toISOString().split('T')[0]);
    const [activities, setActivities] = useState([]);
    const [fetched, setFetched] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/projects')
            .then(res => setProjects(res.data))
            .catch(() => navigate('/'));
    }, [navigate]);

    const handleFetch = async (e) => {
        e.preventDefault();
        try {
            const response = await api.get('/activities/report', {
                params: { projectId, start, end }
            });
            setActivities(response.data);
            setFetched(true);
        } catch (err) {
            alert('Failed to fetch report');
        }
    };

    const exportCSV = () => {
        const headers = 'Date,Activity,Notes,Logged By\n';
        const rows = activities.map(a =>
            `${a.activityDate},"${a.description}","${a.notes || ''}","${a.userName}"`
        ).join('\n');

        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `fpms_report_${start}_to_${end}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Generate Report</h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-sm underline hover:text-gray-200"
                >
                    Back to Dashboard
                </button>
            </nav>

            <div className="max-w-3xl mx-auto mt-8">
                <div className="bg-white p-6 rounded shadow mb-6">
                    <form onSubmit={handleFetch} className="flex gap-4 items-end flex-wrap">
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-sm font-medium mb-1">Project</label>
                            <select
                                value={projectId}
                                onChange={(e) => setProjectId(e.target.value)}
                                className="w-full border rounded px-3 py-2"
                                required
                            >
                                <option value="">Select</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">From</label>
                            <input
                                type="date"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                className="border rounded px-3 py-2"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">To</label>
                            <input
                                type="date"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                className="border rounded px-3 py-2"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800"
                        >
                            Fetch
                        </button>
                    </form>
                </div>

                {fetched && (
                    <div className="bg-white rounded shadow">
                        <div className="flex justify-between items-center p-4 border-b">
                            <p className="text-sm text-gray-500">
                                {activities.length} activities found
                            </p>
                            {activities.length > 0 && (
                                <button
                                    onClick={exportCSV}
                                    className="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
                                >
                                    Export CSV
                                </button>
                            )}
                        </div>

                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left p-3 text-sm font-medium text-gray-600">Date</th>
                                    <th className="text-left p-3 text-sm font-medium text-gray-600">Activity</th>
                                    <th className="text-left p-3 text-sm font-medium text-gray-600">Notes</th>
                                    <th className="text-left p-3 text-sm font-medium text-gray-600">Logged By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-6 text-center text-gray-400">
                                            No activities in this range
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map(a => (
                                        <tr key={a.id} className="border-t">
                                            <td className="p-3 text-sm">{a.activityDate}</td>
                                            <td className="p-3 text-sm">{a.description}</td>
                                            <td className="p-3 text-sm text-gray-500">{a.notes || '—'}</td>
                                            <td className="p-3 text-sm">{a.userName}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}