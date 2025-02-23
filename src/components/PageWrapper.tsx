import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface PageWrapperProps {
    children: React.ReactNode;
}

export const PageWrapper = ({ children }: PageWrapperProps) => {
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                router.push('/login');
            }
        });

        // Initial session check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (!session?.user) {
                router.push('/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (!user) {
        return null; // Or a loading state if you prefer
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-xl font-bold text-mlb-blue">
                            Guess the Player
                        </h1>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center space-x-3 hover:bg-gray-50 rounded-full p-1.5 transition-colors">
                            <Avatar className="h-8 w-8 border border-gray-200">
                                <AvatarFallback>
                                    {user.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <div className="px-2 py-1.5 text-sm text-gray-500">
                                {user.email}
                            </div>
                            <DropdownMenuItem
                                className="text-red-600 cursor-pointer"
                                onClick={handleLogout}
                            >
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>

            <main>
                {children}
            </main>
        </div>
    );
}; 