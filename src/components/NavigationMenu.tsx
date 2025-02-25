'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabaseClient';
import { Button } from './ui/button';
import { LogIn, LogOut, Loader2, User, Plus } from 'lucide-react';
import LogoutButton from './LogoutButton';

const NavMenu = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for user session on component mount
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user || null);
                setLoading(false);
            } catch (error) {
                console.error('Error checking user session:', error);
                setLoading(false);
            }
        };

        checkUser();

        // Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed in NavMenu:', event);
            setUser(session?.user || null);
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    return (
        <nav className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
            <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-mlb-blue mr-8">
                    Guess the Player
                </Link>
                <div className="hidden md:flex space-x-6">
                    <Link href="/" className="text-gray-600 hover:text-mlb-blue">
                        Home
                    </Link>
                    <Link href="/create" className="text-gray-600 hover:text-mlb-blue">
                        Create Game
                    </Link>
                    {user && (
                        <Link href="/profile" className="text-gray-600 hover:text-mlb-blue">
                            My Games
                        </Link>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-4">
                {loading ? (
                    <Button variant="ghost" disabled>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                    </Button>
                ) : user ? (
                    <div className="flex items-center space-x-4">
                        <div className="hidden md:block text-sm text-gray-600">
                            {user.email}
                        </div>
                        <LogoutButton size="sm" />
                    </div>
                ) : (
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push('/login')}
                        >
                            <LogIn className="h-4 w-4 mr-2" />
                            Login
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => router.push('/signup')}
                            className="bg-mlb-blue hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Sign Up
                        </Button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavMenu; 