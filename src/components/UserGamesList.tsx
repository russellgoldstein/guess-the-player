'use client';

import React, { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentSession, refreshSessionIfNeeded } from '@/src/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Clipboard, Trash2, ExternalLink, AlertCircle, Copy } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Skeleton } from "./ui/skeleton";
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Game {
    id: string;
    title: string;
    created_at: string;
    creator_id: string | null;
    game_player_config: {
        id: string;
        game_id: string;
        player_id: number;
        stats_config: any;
        game_options: any;
    }[];
    user_id: string;
}

interface UserGamesListProps {
    user: User | null;
}

export const UserGamesList = ({ user }: UserGamesListProps) => {
    const [games, setGames] = useState<Game[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('created');
    const router = useRouter();
    const { toast } = useToast();

    // Use refs to prevent infinite loops and duplicate toasts
    const hasShownAuthErrorToast = useRef(false);
    const fetchAttempts = useRef(0);
    const maxFetchAttempts = 3;
    const isAuthenticated = useRef(false);

    useEffect(() => {
        const checkAuthAndFetchGames = async () => {
            try {
                // Reset fetch attempts on component mount
                fetchAttempts.current = 0;
                hasShownAuthErrorToast.current = false;

                // Check if user is authenticated
                const session = await getCurrentSession();

                if (session) {
                    console.log('User is authenticated, fetching games');
                    isAuthenticated.current = true;
                    fetchUserGames();
                } else {
                    console.log('User is not authenticated');
                    isAuthenticated.current = false;
                    setLoading(false);

                    if (!hasShownAuthErrorToast.current) {
                        toast({
                            title: 'Authentication required',
                            description: 'Please log in to view your games',
                            variant: 'destructive',
                        });
                        hasShownAuthErrorToast.current = true;
                    }
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                setLoading(false);
            }
        };

        checkAuthAndFetchGames();

        // Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed in UserGamesList:', event);

            if (event === 'SIGNED_IN') {
                console.log('User signed in, fetching games');
                isAuthenticated.current = true;
                hasShownAuthErrorToast.current = false; // Reset toast flag on sign in
                fetchUserGames();
            } else if (event === 'SIGNED_OUT') {
                console.log('User signed out');
                isAuthenticated.current = false;
                setGames([]);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const fetchUserGames = async () => {
        // Prevent too many fetch attempts
        if (fetchAttempts.current >= maxFetchAttempts) {
            console.log(`Reached maximum fetch attempts (${maxFetchAttempts}), stopping`);
            setLoading(false);
            return;
        }

        fetchAttempts.current += 1;
        console.log(`Fetching user games (attempt ${fetchAttempts.current})`);
        setLoading(true);

        try {
            // Try to refresh the session if needed
            const session = await refreshSessionIfNeeded();

            if (!session) {
                console.log('No valid session found, cannot fetch games');
                if (!hasShownAuthErrorToast.current) {
                    toast({
                        title: 'Authentication required',
                        description: 'Please log in to view your games',
                        variant: 'destructive',
                    });
                    hasShownAuthErrorToast.current = true;
                }
                setLoading(false);
                return;
            }

            // Make the API request
            const response = await fetch('/api/games/user', {
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });
            console.log('API response status:', response.status);

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Authentication error when fetching games');
                    isAuthenticated.current = false;

                    if (!hasShownAuthErrorToast.current) {
                        toast({
                            title: 'Authentication error',
                            description: 'Your session has expired. Please log in again.',
                            variant: 'destructive',
                        });
                        hasShownAuthErrorToast.current = true;
                    }

                    setLoading(false);
                    return;
                }

                throw new Error(`Failed to fetch user games: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Fetched games:', data);

            // Reset fetch attempts on successful fetch
            fetchAttempts.current = 0;

            setGames(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching user games:', error);

            // Only show error toast once
            if (!hasShownAuthErrorToast.current) {
                toast({
                    title: 'Error',
                    description: 'Failed to fetch your games. Please try again later.',
                    variant: 'destructive',
                });
                hasShownAuthErrorToast.current = true;
            }

            setLoading(false);
        }
    };

    const handleDeleteGame = async (gameId: string) => {
        try {
            console.log('Deleting game:', gameId);

            const response = await fetch(`/api/games/user?gameId=${gameId}`, {
                method: 'DELETE',
            });

            console.log('Delete response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error response from delete API:', errorData);
                throw new Error(errorData.message || 'Failed to delete game');
            }

            console.log('Game deleted successfully');
            toast({
                title: 'Game deleted',
                description: 'Your game has been deleted successfully.',
            });

            // Refresh the games list
            setGames(games.filter(game => game.id !== gameId));
        } catch (error) {
            console.error('Error deleting game:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete game. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleCopyLink = (gameId: string) => {
        try {
            const gameUrl = `${window.location.origin}/game/${gameId}`;
            navigator.clipboard.writeText(gameUrl);
            console.log('Copied game link:', gameUrl);

            toast({
                title: 'Link copied',
                description: 'Game link copied to clipboard',
            });
        } catch (error) {
            console.error('Error copying link:', error);
            toast({
                title: 'Error',
                description: 'Failed to copy link. Please try again.',
                variant: 'destructive',
            });
        }
    };

    const handleLogin = () => {
        // Reset the toast flag when user attempts to log in
        hasShownAuthErrorToast.current = false;
        router.push('/login');
    };

    if (!user) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Your Games</CardTitle>
                    <CardDescription>
                        Please log in to view your games
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-8">
                    <div className="text-center">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-500 mb-4">You need to be logged in to view your games</p>
                        <Button onClick={handleLogin}>
                            Log In
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mlb-blue"></div>
            </div>
        );
    }

    if (!isAuthenticated.current) {
        return (
            <div className="text-center p-8 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Please log in to view your games</h3>
                <Button onClick={handleLogin} className="bg-mlb-blue hover:bg-blue-700">
                    Log In
                </Button>
            </div>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Your Games</CardTitle>
                <CardDescription>
                    Manage games you've created or completed
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full mb-6">
                        <TabsTrigger value="created" className="flex-1">Created Games</TabsTrigger>
                        <TabsTrigger value="completed" className="flex-1">Completed Games</TabsTrigger>
                    </TabsList>

                    <TabsContent value="created">
                        {games.length === 0 ? (
                            <div className="text-center p-8 border border-gray-200 rounded-lg">
                                <p className="text-gray-500">You haven't created any games yet.</p>
                                <Button
                                    onClick={() => router.push('/create')}
                                    className="mt-4 bg-mlb-blue hover:bg-blue-700"
                                >
                                    Create a Game
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {games.map((game) => (
                                    <Card key={game.id} className="overflow-hidden">
                                        <CardHeader className="bg-gray-50 p-4">
                                            <CardTitle className="text-lg flex justify-between items-center">
                                                <span className="truncate">{game.title}</span>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleCopyLink(game.id)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteGame(game.id)}
                                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <p className="text-sm text-gray-500">
                                                Created: {new Date(game.created_at).toLocaleDateString()}
                                            </p>
                                            <Button
                                                onClick={() => router.push(`/game/${game.id}`)}
                                                className="w-full mt-4 bg-mlb-blue hover:bg-blue-700"
                                            >
                                                Play Game
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="completed">
                        <div className="text-center p-8 border border-gray-200 rounded-lg">
                            <p className="text-gray-500">Completed games feature coming soon.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}; 