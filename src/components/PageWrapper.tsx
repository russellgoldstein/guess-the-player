'use client';

import { User } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Link from 'next/link';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from "@radix-ui/react-navigation-menu";
import { PlusCircle, Shuffle } from "lucide-react";

interface PageWrapperProps {
    children: React.ReactNode;
}

export const PageWrapper = ({ children }: PageWrapperProps) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };

        fetchUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/" className="text-xl font-bold text-mlb-blue hover:text-mlb-blue/90">
                            Stat Attack
                        </Link>
                        <NavigationMenu className="hidden md:flex">
                            <NavigationMenuList className="flex space-x-2">
                                <NavigationMenuItem>
                                    <Link href="/create-game" legacyBehavior passHref>
                                        <NavigationMenuLink className="px-4 py-2 text-sm text-white bg-mlb-blue hover:bg-mlb-blue/90 rounded-md flex items-center">
                                            <PlusCircle className="h-4 w-4 mr-2" />
                                            Create Game
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                                <NavigationMenuItem>
                                    <Link href="/game/random" legacyBehavior passHref>
                                        <NavigationMenuLink className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center">
                                            <Shuffle className="h-4 w-4 mr-2" />
                                            Play Random Game
                                        </NavigationMenuLink>
                                    </Link>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {user ? (
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
                    ) : (
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/login"
                                className="text-sm font-medium text-gray-700 hover:text-mlb-blue"
                            >
                                Log in
                            </Link>
                            <Link
                                href="/create-account"
                                className="text-sm font-medium text-white bg-mlb-blue hover:bg-mlb-blue/90 px-4 py-2 rounded-md"
                            >
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            <main>
                {children}
            </main>
        </div>
    );
}; 