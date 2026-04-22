import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            setProjects(response.data);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.clear();
                navigate('/');
            }
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.clear();
        navigate('/');
    };

    const activeCount = projects.filter(p => p.status === 'ACTIVE').length;
    const holdCount = projects.filter(p => p.status === 'ON_HOLD').length;
    const completedCount = projects.filter(p => p.status === 'COMPLETED').length;

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-green-700 text-white px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">FPMS Dashboard</h1>
                <div className="flex items-center gap-4">
                    <span className="text-sm">{user?.fullName}</span>
                    <button
                        onClick={() => navigate('/log')}
                        className="bg-white text-green-700 px-4 py-1 rounded text-sm font-medium hover:bg-gray-100"
                    >
                        + Log Activity
                    </button>
                    <button
                        onClick={logout}
                        className="text-sm underline hover:text-gray-200"
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded shadow text-center">
                        <p className="text-3xl font-bold text-green-700">{activeCount}</p>
                        <p className="text-sm text-gray-500">Active</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow text-center">
                        <p className="text-3xl font-bold text-yellow-600">{holdCount}</p>
                        <p className="text-sm text-gray-500">On Hold</p>
                    </div>
                    <div className="bg-white p-4 rounded shadow text-center">
                        <p className="text-3xl font-bold text-blue-600">{completedCount}</p>
                        <p className="text-sm text-gray-500">Completed</p>
                    </div>
                </div>

                <div className="bg-white rounded shadow">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="text-left p-3 text-sm font-medium text-gray-600">Project</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-600">Lead</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-600">Status</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-600">Activities</th>
                                <th className="text-left p-3 text-sm font-medium text-gray-600">Last Update</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-6 text-center text-gray-400">
                                        No projects yet
                                    </td>
                                </tr>
                            ) : (
                                projects.map(project => (
                                    <tr key={project.id} className="border-t hover:bg-gray-50">
                                        <td className="p-3 font-medium">{project.title}</td>
                                        <td className="p-3 text-sm text-gray-600">{project.leadName}</td>
                                        <td className="p-3">
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                project.status === 'ACTIVE'
                                                    ? 'bg-green-100 text-green-700'
                                                    : project.status === 'ON_HOLD'
                                                    ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-sm">{project.activityCount}</td>
                                        <td className="p-3 text-sm text-gray-500">
                                            {project.lastActivityDate || '—'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}