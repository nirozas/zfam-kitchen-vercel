import { Search, User, Calendar, ChefHat, LogIn, LogOut, ShoppingCart } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useShoppingCart } from '@/contexts/ShoppingCartContext';

export default function Navbar() {
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null>(null);
    const { cartCount } = useShoppingCart();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="bg-primary-500 p-2 rounded-xl text-white">
                            <ChefHat size={24} />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-900 hidden sm:block">
                            Niroz's Kitchen
                        </span>
                    </Link>

                    <div className="hidden sm:flex items-center gap-6 ml-6">
                        <Link to="/create" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                            + New Recipe
                        </Link>
                        <Link to="/search" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                            Recipes
                        </Link>
                        <Link to="/categories" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                            Categories
                        </Link>
                    </div>

                    {/* Search Bar - Center */}
                    <div className="flex-1 max-w-md mx-4 hidden sm:block">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const query = formData.get('search') as string;
                                navigate(`/search?q=${encodeURIComponent(query)}`);
                            }}
                            className="relative group"
                        >
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                name="search"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-primary-500 transition-all duration-200 sm:text-sm"
                                placeholder="Search for recipes..."
                            />
                        </form>
                    </div>

                    {/* Right Actions */}
                    <div className="hidden sm:flex items-center gap-4">
                        <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100">
                            <ShoppingCart size={22} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <Link to="/planner" className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
                            <Calendar size={20} />
                            <span className="font-medium text-sm">My Calendar</span>
                        </Link>

                        {session ? (
                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-2 p-1 pr-3 rounded-full border border-gray-200 hover:shadow-md transition-all">
                                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                        <User size={20} className="text-gray-500" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
                                        {session.user.user_metadata.username || 'Profile'}
                                    </span>
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <Link to="/auth" className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-full text-sm font-medium hover:bg-primary-700 transition-colors shadow-sm hover:shadow-primary-200">
                                <LogIn size={18} />
                                Sign In
                            </Link>
                        )}
                    </div>

                    {/* Mobile Search Icon (visible only on mobile) */}
                    <div className="sm:hidden">
                        <Link to="/search" className="p-2 text-gray-600">
                            <Search size={24} />
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
