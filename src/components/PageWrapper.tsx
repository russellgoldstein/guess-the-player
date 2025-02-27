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
import { Menu, PlusCircle, Shuffle } from "lucide-react";
import { Button } from "./ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "../components/ui/sheet";
import Image from 'next/image';

interface PageWrapperProps {
    children: React.ReactNode;
}

export const PageWrapper = ({ children }: PageWrapperProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [isOpen, setIsOpen] = useState(false);

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
        setIsOpen(false);
    };

    // Navigation items that can be reused in both desktop and mobile views
    const navigationItems = [
        {
            href: "/create-game",
            label: "Create Game",
            icon: <PlusCircle className="h-4 w-4 mr-2" />,
            className: "text-white bg-mlb-blue hover:bg-mlb-blue/90"
        },
        {
            href: "/game/random",
            label: "Play Random Game",
            icon: <Shuffle className="h-4 w-4 mr-2" />,
            className: "text-white bg-green-600 hover:bg-green-700"
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        {/* Mobile Navigation Trigger - Now positioned before the logo */}
                        <div className="md:hidden">
                            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" aria-label="Menu">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-[250px] sm:w-[300px]">
                                    <SheetHeader className="border-b pb-4 mb-4">
                                        <SheetTitle className="text-left">Menu</SheetTitle>
                                    </SheetHeader>
                                    <div className="flex flex-col space-y-3">
                                        {navigationItems.map((item, index) => (
                                            <SheetClose asChild key={index}>
                                                <Link
                                                    href={item.href}
                                                    className={`px-4 py-2 text-sm rounded-md flex items-center ${item.className}`}
                                                >
                                                    {item.icon}
                                                    {item.label}
                                                </Link>
                                            </SheetClose>
                                        ))}

                                        {/* Mobile-only user actions */}
                                        <div className="pt-4 mt-4 border-t">
                                            {user ? (
                                                <div className="space-y-3">
                                                    <div className="flex items-center space-x-3 px-4 py-2">
                                                        <Avatar className="h-8 w-8 border border-gray-200">
                                                            <AvatarFallback>
                                                                {user.email?.charAt(0).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm text-gray-700 truncate">
                                                            {user.email}
                                                        </span>
                                                    </div>
                                                    <SheetClose asChild>
                                                        <Button
                                                            variant="destructive"
                                                            className="w-full"
                                                            onClick={handleLogout}
                                                        >
                                                            Log out
                                                        </Button>
                                                    </SheetClose>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col space-y-3">
                                                    <SheetClose asChild>
                                                        <Link
                                                            href="/login"
                                                            className="w-full text-center text-sm font-medium text-gray-700 hover:text-mlb-blue border border-gray-300 px-4 py-2 rounded-md"
                                                        >
                                                            Log in
                                                        </Link>
                                                    </SheetClose>
                                                    <SheetClose asChild>
                                                        <Link
                                                            href="/create-account"
                                                            className="w-full text-center text-sm font-medium text-white bg-mlb-blue hover:bg-mlb-blue/90 px-4 py-2 rounded-md"
                                                        >
                                                            Sign up
                                                        </Link>
                                                    </SheetClose>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        <Link href="/" className="flex items-center">
                            <div className="w-24 h-24 flex items-center justify-center">
                                <Image
                                    src="/images/logo.svg"
                                    alt="Stat Attack Logo"
                                    width={32}
                                    height={32}
                                    className="w-full h-full"
                                />
                            </div>
                            <span className="text-xl font-bold text-mlb-blue hover:text-mlb-blue/90 ml-0.5">
                                Stat Attack
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <NavigationMenu className="hidden md:flex">
                            <NavigationMenuList className="flex space-x-2">
                                {navigationItems.map((item, index) => (
                                    <NavigationMenuItem key={index}>
                                        <Link href={item.href} legacyBehavior passHref>
                                            <NavigationMenuLink className={`px-4 py-2 text-sm rounded-md flex items-center ${item.className}`}>
                                                {item.icon}
                                                {item.label}
                                            </NavigationMenuLink>
                                        </Link>
                                    </NavigationMenuItem>
                                ))}
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    <div className="flex items-center">
                        {/* Desktop User Menu */}
                        <div className="hidden md:block">
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

                        {/* Mobile User Menu - Show only authentication buttons on mobile */}
                        <div className="md:hidden">
                            {!user && (
                                <div className="flex items-center space-x-2">
                                    <Link
                                        href="/login"
                                        className="text-sm font-medium text-gray-700 hover:text-mlb-blue"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href="/create-account"
                                        className="text-sm font-medium text-white bg-mlb-blue hover:bg-mlb-blue/90 px-3 py-1.5 rounded-md"
                                    >
                                        Sign up
                                    </Link>
                                </div>
                            )}
                            {user && (
                                <Avatar className="h-8 w-8 border border-gray-200">
                                    <AvatarFallback>
                                        {user.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main>
                {children}
            </main>
        </div>
    );
}; 