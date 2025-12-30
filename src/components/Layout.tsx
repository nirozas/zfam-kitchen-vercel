import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileNav from './MobileNav';

export default function Layout() {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 pb-20 sm:pb-0 font-sans">
            <Navbar />
            <main className="pt-20 min-h-[calc(100vh-64px)]">
                <Outlet />
            </main>
            <MobileNav />
        </div>
    );
}
