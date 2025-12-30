import { Home, Search, Calendar, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';

export default function MobileNav() {
    const location = useLocation();
    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-6 py-3 sm:hidden safe-area-bottom">
            <div className="flex justify-between items-center">
                <Link to="/" className={clsx("flex flex-col items-center gap-1", isActive('/') ? "text-primary-600" : "text-gray-400")}>
                    <Home size={24} />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <button className="flex flex-col items-center gap-1 text-gray-400">
                    <Search size={24} />
                    <span className="text-[10px] font-medium">Search</span>
                </button>
                <Link to="/planner" className={clsx("flex flex-col items-center gap-1", isActive('/planner') ? "text-primary-600" : "text-gray-400")}>
                    <Calendar size={24} />
                    <span className="text-[10px] font-medium">Calendar</span>
                </Link>
                <button className="flex flex-col items-center gap-1 text-gray-400">
                    <User size={24} />
                    <span className="text-[10px] font-medium">Profile</span>
                </button>
            </div>
        </div>
    );
}
