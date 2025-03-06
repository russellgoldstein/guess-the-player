'use client';

import React, { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, getCurrentSession, refreshSessionIfNeeded } from '@/src/lib/supabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Clipboard, Trash2, ExternalLink, AlertCircle, Copy, PlusCircle, Loader2, Search, RefreshCw } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Skeleton } from "./ui/skeleton";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Input } from "./ui/input";
import { formatDistanceToNow } from "date-fns";

interface Game {
    id: string;
    title: string;
    created_at: string;
    creator_id: string | null;
    completion_date?: string | null;
    game_player_config: {
        id: string;
        game_id: string;
        player_id: number;
        stats_config: any;
        game_options: any;
    }[];
}

interface PaginationMetadata {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
}

interface PaginatedGamesResponse {
    games: Game[];
    pagination: PaginationMetadata;
}

interface UserGamesListProps {
    user: User | null;
}

export const UserGamesList = ({ user }: UserGamesListProps) => {
    const [activeTab, setActiveTab] = useState<string>("created");
    const [games, setGames] = useState<Game[]>([]);
    const [completedGames, setCompletedGames] = useState<Game[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingCompleted, setIsLoadingCompleted] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const hasShownAuthErrorToast = useRef(false);
    const fetchAttempts = useRef(0);
    const maxFetchAttempts = 3;
    const isAuthenticated = useRef(false);
    const { toast } = useToast();
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [gameToDelete, setGameToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [copiedGameId, setCopiedGameId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [completedSearchQuery, setCompletedSearchQuery] = useState("");
    const [isPlaying, setIsPlaying] = useState(false);
    const [playingGameId, setPlayingGameId] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isRefreshingCompleted, setIsRefreshingCompleted] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
    const [lastCompletedRefreshed, setLastCompletedRefreshed] = useState<Date | null>(null);

    // Pagination state for created games
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Pagination state for completed games
    const [completedCurrentPage, setCompletedCurrentPage] = useState(1);
    const [completedPageSize, setCompletedPageSize] = useState(10);
    const [completedTotalItems, setCompletedTotalItems] = useState(0);
    const [completedTotalPages, setCompletedTotalPages] = useState(0);

    useEffect(() => {
        const checkAuthAndFetchGames = async () => {
            try {
                // Reset fetch attempts on component mount
                fetchAttempts.current = 0;
                hasShownAuthErrorToast.current = false;

                // Check if user is authenticated
                const session = await getCurrentSession();

                if (session) {
                    isAuthenticated.current = true;
                    fetchUserGames();
                    fetchCompletedGames();
                } else {
                    isAuthenticated.current = false;
                    setIsLoading(false);
                    setIsLoadingCompleted(false);

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
                setIsLoading(false);
                setIsLoadingCompleted(false);
            }
        };

        checkAuthAndFetchGames();

        // Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                isAuthenticated.current = true;
                hasShownAuthErrorToast.current = false; // Reset toast flag on sign in
                fetchUserGames();
                fetchCompletedGames();
            } else if (event === 'SIGNED_OUT') {
                isAuthenticated.current = false;
                setGames([]);
                setCompletedGames([]);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    // Fetch created games when pagination parameters change
    useEffect(() => {
        if (isAuthenticated.current) {
            fetchUserGames();
        }
    }, [currentPage, pageSize]);

    // Fetch completed games when pagination parameters change
    useEffect(() => {
        if (isAuthenticated.current) {
            fetchCompletedGames();
        }
    }, [completedCurrentPage, completedPageSize]);

    // Debounced search effect for created games
    useEffect(() => {
        if (!isAuthenticated.current) return;

        const handler = setTimeout(() => {
            fetchUserGames();
        }, 300);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Debounced search effect for completed games
    useEffect(() => {
        if (!isAuthenticated.current) return;

        const handler = setTimeout(() => {
            fetchCompletedGames();
        }, 300);

        return () => clearTimeout(handler);
    }, [completedSearchQuery]);

    // Listen for tab changes to refresh data as needed
    useEffect(() => {
        if (!isAuthenticated.current) return;

        if (activeTab === "created" && !lastRefreshed) {
            fetchUserGames();
        } else if (activeTab === "completed" && !lastCompletedRefreshed) {
            fetchCompletedGames();
        }
    }, [activeTab]);

    const fetchUserGames = async () => {
        // Prevent too many fetch attempts
        if (fetchAttempts.current >= maxFetchAttempts) {
            setIsLoading(false);
            return;
        }

        fetchAttempts.current += 1;
        setIsLoading(true);

        try {
            // Try to refresh the session if needed
            const session = await refreshSessionIfNeeded();

            if (!session) {
                if (!hasShownAuthErrorToast.current) {
                    toast({
                        title: 'Authentication required',
                        description: 'Please log in to view your games',
                        variant: 'destructive',
                    });
                    hasShownAuthErrorToast.current = true;
                }
                setIsLoading(false);
                return;
            }

            // Build URL with pagination and search parameters
            const url = new URL('/api/games/user', window.location.origin);
            url.searchParams.append('page', currentPage.toString());
            url.searchParams.append('page_size', pageSize.toString());

            if (searchQuery) {
                url.searchParams.append('search', searchQuery);
            }

            // Make the API request
            const response = await fetch(url.toString(), {
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

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

                    setIsLoading(false);
                    return;
                }

                throw new Error(`Failed to fetch user games: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as PaginatedGamesResponse;

            // Reset fetch attempts on successful fetch
            fetchAttempts.current = 0;

            setGames(data.games);
            setIsLoading(false);
            setLastRefreshed(new Date());
            setTotalItems(data.pagination.totalCount);
            setTotalPages(data.pagination.totalPages);
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

            setIsLoading(false);
        }
    };

    const fetchCompletedGames = async () => {
        // Prevent too many fetch attempts
        if (fetchAttempts.current >= maxFetchAttempts) {
            setIsLoadingCompleted(false);
            return;
        }

        fetchAttempts.current += 1;
        setIsLoadingCompleted(true);

        try {
            // Try to refresh the session if needed
            const session = await refreshSessionIfNeeded();

            if (!session) {
                if (!hasShownAuthErrorToast.current) {
                    toast({
                        title: 'Authentication required',
                        description: 'Please log in to view your completed games',
                        variant: 'destructive',
                    });
                    hasShownAuthErrorToast.current = true;
                }
                setIsLoadingCompleted(false);
                return;
            }

            // Build URL with pagination and search parameters
            const url = new URL('/api/games/user/completed', window.location.origin);
            url.searchParams.append('page', completedCurrentPage.toString());
            url.searchParams.append('page_size', completedPageSize.toString());

            if (completedSearchQuery) {
                url.searchParams.append('search', completedSearchQuery);
            }

            // Make the API request
            const response = await fetch(url.toString(), {
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Authentication error when fetching completed games');
                    isAuthenticated.current = false;

                    if (!hasShownAuthErrorToast.current) {
                        toast({
                            title: 'Authentication error',
                            description: 'Your session has expired. Please log in again.',
                            variant: 'destructive',
                        });
                        hasShownAuthErrorToast.current = true;
                    }

                    setIsLoadingCompleted(false);
                    return;
                }

                throw new Error(`Failed to fetch completed games: ${response.status} ${response.statusText}`);
            }

            const data = await response.json() as PaginatedGamesResponse;

            // Reset fetch attempts on successful fetch
            fetchAttempts.current = 0;

            setCompletedGames(data.games);
            setIsLoadingCompleted(false);
            setLastCompletedRefreshed(new Date());
            setCompletedTotalItems(data.pagination.totalCount);
            setCompletedTotalPages(data.pagination.totalPages);
        } catch (error) {
            console.error('Error fetching completed games:', error);

            // Only show error toast once
            if (!hasShownAuthErrorToast.current) {
                toast({
                    title: 'Error',
                    description: 'Failed to fetch your completed games. Please try again later.',
                    variant: 'destructive',
                });
                hasShownAuthErrorToast.current = true;
            }

            setIsLoadingCompleted(false);
        }
    };

    const handleDeleteGame = async (gameId: string, event?: React.MouseEvent) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        setIsDeleting(true);
        try {
            const { error } = await supabase
                .from('games')
                .delete()
                .eq('id', gameId);

            if (error) {
                console.error('Error deleting game:', error);
                toast({
                    title: "Error",
                    description: "Failed to delete game. Please try again.",
                    variant: "destructive",
                });
                return;
            }

            // Remove the game from the state
            setGames(games.filter(game => game.id !== gameId));
            toast({
                title: "Success",
                description: "Game deleted successfully",
            });
        } catch (error) {
            console.error('Error deleting game:', error);
            toast({
                title: "Error",
                description: "An unexpected error occurred. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setGameToDelete(null);
        }
    };

    const confirmDelete = (gameId: string, event?: React.MouseEvent) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        setGameToDelete(gameId);
    };

    const handleCopyGameLink = async (gameId: string, event?: React.MouseEvent) => {
        // Prevent default behavior to avoid page refresh
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        // Don't proceed if already copying
        if (isCopying) return;

        setIsCopying(true);
        setCopiedGameId(gameId);

        try {
            const gameUrl = `${window.location.origin}/game/${gameId}`;

            // Use the modern clipboard API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(gameUrl);

                toast({
                    title: "Link Copied",
                    description: "Game link copied to clipboard",
                });
            } else {
                // Fallback for browsers that don't support the Clipboard API
                const textArea = document.createElement('textarea');
                textArea.value = gameUrl;

                // Make the textarea out of viewport
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);

                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    toast({
                        title: "Link Copied",
                        description: "Game link copied to clipboard",
                    });
                } else {
                    throw new Error('Failed to copy text');
                }
            }
        } catch (error) {
            console.error('Error copying game link:', error);
            toast({
                title: "Error",
                description: "Failed to copy link. Please try again.",
                variant: "destructive",
            });
        } finally {
            // Use a timeout to show the copying state briefly
            setTimeout(() => {
                setIsCopying(false);
                setCopiedGameId(null);
            }, 1000);
        }
    };

    const handleLogin = () => {
        // Reset the toast flag when user attempts to log in
        hasShownAuthErrorToast.current = false;
        router.push('/login');
    };

    const handleCreateGame = () => {
        setIsCreating(true);
        router.push('/create-game');
    };

    const handlePlayGame = (gameId: string, event?: React.MouseEvent) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        setIsPlaying(true);
        setPlayingGameId(gameId);
        router.push(`/game/${gameId}`);
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        fetchUserGames();
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    const handleRefreshCompleted = () => {
        setIsRefreshingCompleted(true);
        fetchCompletedGames();
        setTimeout(() => {
            setIsRefreshingCompleted(false);
        }, 1000);
    };

    // Filter games based on search query
    // We're now using backend filtering, so we don't need to filter the games client-side
    const filteredGames = games;

    // Filter completed games based on search query (we're using server-side filtering now)
    const filteredCompletedGames = completedGames;

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

    if (isLoading) {
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
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <h3 className="text-lg font-medium">Your Created Games</h3>
                                <span className="ml-2 text-sm text-muted-foreground">
                                    ({games.length} {games.length === 1 ? 'game' : 'games'})
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRefresh}
                                    disabled={isRefreshing || isLoading}
                                    className="ml-2"
                                    title={lastRefreshed ? `Last refreshed: ${lastRefreshed.toLocaleTimeString()}` : 'Refresh'}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    <span className="sr-only">Refresh</span>
                                </Button>
                                {lastRefreshed && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        Updated: {lastRefreshed.toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                            <Button
                                onClick={handleCreateGame}
                                className="bg-mlb-blue hover:bg-blue-700 text-white"
                                disabled={isCreating}
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <PlusCircle className="h-4 w-4 mr-2" />
                                        Create Game
                                    </>
                                )}
                            </Button>
                        </div>

                        {games.length === 0 ? (
                            <div className="text-center p-8 border border-gray-200 rounded-lg">
                                <p className="text-gray-500">You haven't created any games yet.</p>
                                <Button
                                    onClick={handleCreateGame}
                                    className="mt-4 bg-mlb-blue hover:bg-blue-700 text-white"
                                    disabled={isCreating}
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create a Game"
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="relative mb-4">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search games by player name..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setSearchQuery(newValue);
                                            // Reset to first page when searching
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>

                                {filteredGames.length === 0 ? (
                                    <div className="text-center p-8 border border-gray-200 rounded-lg">
                                        <p className="text-gray-500">No games match your search.</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Player</TableHead>
                                                    <TableHead>Created</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredGames.map((game) => (
                                                    <TableRow key={game.id}>
                                                        <TableCell className="font-medium">
                                                            {game.title}
                                                        </TableCell>
                                                        <TableCell>
                                                            {formatDistanceToNow(new Date(game.created_at), { addSuffix: true })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end space-x-2">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handlePlayGame(game.id, e);
                                                                                    return false;
                                                                                }}
                                                                                className="h-8 w-8"
                                                                                disabled={isPlaying && playingGameId === game.id}
                                                                                type="button"
                                                                            >
                                                                                {isPlaying && playingGameId === game.id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : (
                                                                                    <ExternalLink className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Play Game</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>

                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handleCopyGameLink(game.id, e);
                                                                                    return false;
                                                                                }}
                                                                                className="h-8 w-8"
                                                                                disabled={isCopying && copiedGameId === game.id}
                                                                                type="button"
                                                                            >
                                                                                {isCopying && copiedGameId === game.id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : (
                                                                                    <Copy className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Copy Game Link</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {games.length} of {totalItems} games
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={currentPage <= 1 || isLoading}
                                            >
                                                Previous
                                            </Button>
                                            <div className="flex items-center space-x-1">
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    // Show pages around current page
                                                    let pageToShow;
                                                    if (totalPages <= 5) {
                                                        pageToShow = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        pageToShow = i + 1;
                                                    } else if (currentPage >= totalPages - 2) {
                                                        pageToShow = totalPages - 4 + i;
                                                    } else {
                                                        pageToShow = currentPage - 2 + i;
                                                    }

                                                    return (
                                                        <Button
                                                            key={pageToShow}
                                                            variant={currentPage === pageToShow ? "default" : "outline"}
                                                            size="sm"
                                                            className="w-8 h-8 p-0"
                                                            onClick={() => setCurrentPage(pageToShow)}
                                                            disabled={isLoading}
                                                        >
                                                            {pageToShow}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                                disabled={currentPage >= totalPages || isLoading}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="completed">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center">
                                <h3 className="text-lg font-medium">Completed Games</h3>
                                <span className="ml-2 text-sm text-muted-foreground">
                                    ({completedGames.length} {completedGames.length === 1 ? 'game' : 'games'})
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRefreshCompleted}
                                    disabled={isRefreshingCompleted || isLoadingCompleted}
                                    className="ml-2"
                                    title={lastCompletedRefreshed ? `Last refreshed: ${lastCompletedRefreshed.toLocaleTimeString()}` : 'Refresh'}
                                >
                                    <RefreshCw className={`h-4 w-4 ${isRefreshingCompleted ? 'animate-spin' : ''}`} />
                                    <span className="sr-only">Refresh</span>
                                </Button>
                                {lastCompletedRefreshed && (
                                    <span className="ml-2 text-xs text-muted-foreground">
                                        Updated: {lastCompletedRefreshed.toLocaleTimeString()}
                                    </span>
                                )}
                            </div>
                        </div>

                        {isLoadingCompleted ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <Skeleton className="h-10 w-full" />
                                </div>
                                <div className="rounded-md border">
                                    <div className="h-[300px] w-full flex items-center justify-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mlb-blue"></div>
                                    </div>
                                </div>
                            </div>
                        ) : completedGames.length === 0 ? (
                            <div className="text-center p-8 border border-gray-200 rounded-lg">
                                <p className="text-gray-500">You haven't completed any games yet.</p>
                            </div>
                        ) : (
                            <>
                                <div className="relative mb-4">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search completed games by player name..."
                                        className="pl-8"
                                        value={completedSearchQuery}
                                        onChange={(e) => {
                                            const newValue = e.target.value;
                                            setCompletedSearchQuery(newValue);
                                            // Reset to first page when searching
                                            setCompletedCurrentPage(1);
                                        }}
                                    />
                                </div>

                                {filteredCompletedGames.length === 0 ? (
                                    <div className="text-center p-8 border border-gray-200 rounded-lg">
                                        <p className="text-gray-500">No games match your search.</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Player</TableHead>
                                                    <TableHead>Completed</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredCompletedGames.map((game) => (
                                                    <TableRow key={game.id}>
                                                        <TableCell className="font-medium">
                                                            {game.title}
                                                        </TableCell>
                                                        <TableCell>
                                                            {game.completion_date
                                                                ? formatDistanceToNow(new Date(game.completion_date), { addSuffix: true })
                                                                : formatDistanceToNow(new Date(game.created_at), { addSuffix: true })
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end space-x-2">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handlePlayGame(game.id, e);
                                                                                    return false;
                                                                                }}
                                                                                className="h-8 w-8"
                                                                                disabled={isPlaying && playingGameId === game.id}
                                                                                type="button"
                                                                            >
                                                                                {isPlaying && playingGameId === game.id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : (
                                                                                    <ExternalLink className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Play Game</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>

                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="icon"
                                                                                onClick={(e) => {
                                                                                    e.preventDefault();
                                                                                    e.stopPropagation();
                                                                                    handleCopyGameLink(game.id, e);
                                                                                    return false;
                                                                                }}
                                                                                className="h-8 w-8"
                                                                                disabled={isCopying && copiedGameId === game.id}
                                                                                type="button"
                                                                            >
                                                                                {isCopying && copiedGameId === game.id ? (
                                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                                ) : (
                                                                                    <Copy className="h-4 w-4" />
                                                                                )}
                                                                            </Button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p>Copy Game Link</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}

                                {/* Pagination Controls */}
                                {completedTotalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Showing {completedGames.length} of {completedTotalItems} games
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCompletedCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={completedCurrentPage <= 1 || isLoadingCompleted}
                                            >
                                                Previous
                                            </Button>
                                            <div className="flex items-center space-x-1">
                                                {Array.from({ length: Math.min(5, completedTotalPages) }, (_, i) => {
                                                    // Show pages around current page
                                                    let pageToShow;
                                                    if (completedTotalPages <= 5) {
                                                        pageToShow = i + 1;
                                                    } else if (completedCurrentPage <= 3) {
                                                        pageToShow = i + 1;
                                                    } else if (completedCurrentPage >= completedTotalPages - 2) {
                                                        pageToShow = completedTotalPages - 4 + i;
                                                    } else {
                                                        pageToShow = completedCurrentPage - 2 + i;
                                                    }

                                                    return (
                                                        <Button
                                                            key={pageToShow}
                                                            variant={completedCurrentPage === pageToShow ? "default" : "outline"}
                                                            size="sm"
                                                            className="w-8 h-8 p-0"
                                                            onClick={() => setCompletedCurrentPage(pageToShow)}
                                                            disabled={isLoadingCompleted}
                                                        >
                                                            {pageToShow}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCompletedCurrentPage(prev => Math.min(completedTotalPages, prev + 1))}
                                                disabled={completedCurrentPage >= completedTotalPages || isLoadingCompleted}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}; 