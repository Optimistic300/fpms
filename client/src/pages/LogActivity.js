import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function LogActivity() {
    const [projects, setProjects] = useState([]);
    const [projectId, setProjectId] = useState('');
    const [description, setDescription] = useState('');
    const [notes, setNotes] = useState('');
    const [activityDate, setActivityDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/projects')
            .then(res => setProjects(res.data))
            .catch(() => navigate('/'));
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await api.post('/activities', {
                projectId: Number(projectId),
                description,
                notes,
                activityDate
            });

            setSuccess('Activity logged successfully!');
            setDescription('');
            setNotes('');
            setProjectId('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to log activity');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Log Activity</h1>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="text-sm underline hover:text-gray-200"
                >
                    Back to Dashboard
                </button>
            </nav>

            <div className="max-w-lg mx-auto mt-8 bg-white p-6 rounded shadow">
                {success && (
                    <div className="bg-green-100 text-green-700 p-3 rounded mb-4">
                        {success}
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Project</label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        >
                            <option value="">Select a project</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Date</label>
                        <input
                            type="date"
                            value={activityDate}
                            onChange={(e) => setActivityDate(e.target.value)}
                            className="w-full border rounded px-3 py-2"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Activity Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full border rounded px-3 py-2 h-24"
                            placeholder="What did you do?"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full border rounded px-3 py-2 h-16"
                            placeholder="Any additional details..."
                        />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/dashboard')}
                            className="flex-1 border border-gray-300 py-2 rounded hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-green-700 text-white py-2 rounded hover:bg-green-800"
                        >
                            Save Activity
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}