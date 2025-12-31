import { Search, Calendar, LogIn, LogOut, ShoppingCart, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useShoppingCart } from '@/contexts/ShoppingCartContext';
import { clsx } from 'clsx';

export default function Navbar() {
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null>(null);
    const [profileUsername, setProfileUsername] = useState<string | null>(null);
    const { cartCount } = useShoppingCart();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) fetchProfile(session.user.id);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) fetchProfile(session.user.id);
            else setProfileUsername(null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', userId)
            .single();
        if (data) setProfileUsername(data.username);
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
            <div className="w-full px-2 sm:px-4 lg:px-8">
                <div className="flex justify-between items-center h-16 gap-2">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 flex-shrink-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden bg-white/50 flex transition-transform hover:scale-105">
                            <img
                                src="/logo.png"
                                alt="Zoabi Family Kitchen"
                                className="h-full w-full object-contain mix-blend-multiply"
                            />
                        </div>
                        <span className="font-bold text-base lg:text-xl tracking-tight text-gray-900 hidden md:block font-serif whitespace-nowrap">
                            Zoabi Family Kitchen
                        </span>
                    </Link>

                    {/* Desktop Links - hidden on small tablets */}
                    <div className="hidden lg:flex items-center gap-6 ml-4">
                        <Link to="/create" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors whitespace-nowrap">
                            + New Recipe
                        </Link>
                        <Link to="/search" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                            Recipes
                        </Link>
                        <Link to="/categories" className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
                            Categories
                        </Link>
                    </div>

                    {/* Search Bar - Expanding */}
                    <div className={clsx(
                        "flex-1 transition-all duration-300 ease-in-out px-2",
                        isSearchExpanded ? "max-w-xl" : "max-w-[40px] sm:max-w-xs md:max-w-md"
                    )}>
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
                                <Search className={clsx(
                                    "h-5 w-5 transition-colors",
                                    isSearchExpanded ? "text-primary-500" : "text-gray-400"
                                )} />
                            </div>
                            <input
                                type="text"
                                name="search"
                                onFocus={() => setIsSearchExpanded(true)}
                                onBlur={() => setIsSearchExpanded(false)}
                                className={clsx(
                                    "block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-full leading-5 bg-gray-50/50 backdrop-blur-sm placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary-300 focus:border-primary-500 transition-all duration-300 sm:text-sm",
                                    !isSearchExpanded && "sm:placeholder:text-gray-400 placeholder:text-transparent"
                                )}
                                placeholder="Search recipes..."
                            />
                        </form>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-1 sm:gap-3">
                        <Link to="/create" className="lg:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100" title="New Recipe">
                            <TrendingUp size={22} className="rotate-45" />
                        </Link>

                        <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors rounded-lg hover:bg-gray-100">
                            <ShoppingCart size={22} />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <Link to="/planner" className="hidden sm:flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors px-2 py-2 rounded-lg hover:bg-gray-100">
                            <Calendar size={20} />
                            <span className="font-medium text-xs hidden md:inline">Planner</span>
                        </Link>

                        {session ? (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-primary-100 hover:bg-primary-50/30 transition-all font-bold text-gray-900 group"
                                >
                                    <span className="text-sm truncate max-w-[120px] group-hover:text-primary-600">
                                        {profileUsername || session.user.user_metadata.username || 'User'}
                                    </span>
                                </button>

                                <button
                                    onClick={handleSignOut}
                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <Link to="/auth" className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-full text-xs font-medium hover:bg-primary-700 transition-colors shadow-sm">
                                <LogIn size={16} />
                                <span className="hidden xs:inline">Sign In</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
