import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function MyActivities() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/activities/mine')
            .then(res => {
                setActivities(res.data);
                setLoading(false);
            })
            .catch(() => navigate('/'));
    }, [navigate]);

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">My Activities</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/log')}
                        className="bg-white text-green-700 px-4 py-1 rounded text-sm font-medium hover:bg-gray-100"
                    >
                        + Log Activity
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="text-sm underline hover:text-gray-200"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </nav>

            <div className="max-w-3xl mx-auto mt-8 bg-white rounded shadow">
                <div className="p-4 border-b">
                    <p className="text-sm text-gray-500">
                        {activities.length} activities logged
                    </p>
                </div>

                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Date</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Project</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Activity</th>
                            <th className="text-left p-3 text-sm font-medium text-gray-600">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="p-6 text-center text-gray-400">
                                    No activities yet — start logging!
                                </td>
                            </tr>
                        ) : (
                            activities.map(a => (
                                <tr key={a.id} className="border-t hover:bg-gray-50">
                                    <td className="p-3 text-sm">{a.activityDate}</td>
                                    <td className="p-3 text-sm font-medium">{a.projectTitle}</td>
                                    <td className="p-3 text-sm">{a.description}</td>
                                    <td className="p-3 text-sm text-gray-500">{a.notes || '—'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}