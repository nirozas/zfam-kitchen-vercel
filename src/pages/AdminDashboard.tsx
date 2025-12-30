import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import { Check, ShieldAlert, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        checkAdmin();
        fetchPendingUsers();
    }, []);

    const checkAdmin = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            navigate('/');
            return;
        }
        setIsAdmin(true);
    };

    const fetchPendingUsers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_approved', false);

        if (error) console.error('Error fetching users:', error);
        else setPendingUsers(data || []);
        setLoading(false);
    };

    const approveUser = async (userId: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ is_approved: true })
            .eq('id', userId);

        if (error) {
            alert('Error approving user');
            console.error(error);
        } else {
            setPendingUsers(pendingUsers.filter(u => u.id !== userId));
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;
    if (!isAdmin) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pt-24">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <ShieldAlert className="text-primary-600" />
                Admin Dashboard
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-700">Pending Approvals</h2>
                </div>

                {pendingUsers.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No pending approvals.
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {pendingUsers.map(user => (
                            <li key={user.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                                        ) : (
                                            <User size={20} className="text-gray-500" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user.username || 'No Username'}</p>
                                        <p className="text-sm text-gray-500">ID: {user.id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => approveUser(user.id)}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    <Check size={16} />
                                    Approve
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
