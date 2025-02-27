'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabaseClient';
import { Button } from "../../src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Loader2 } from "lucide-react";
import { useSearchParams } from 'next/navigation';

export default function AuthDebugPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debug, setDebug] = useState<string>('');
    const [session, setSession] = useState<any>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        // Check for code parameter in URL
        const code = searchParams.get('code');
        if (code) {
            setDebug(prev => `${prev}\nDetected code parameter in URL: ${code.substring(0, 10)}...`);
        }

        // Check session on load
        const checkSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    setDebug(prev => `${prev}\nError getting session: ${error.message}`);
                    return;
                }

                setSession(data.session);
                if (data.session) {
                    setDebug(prev => `${prev}\nActive session found for user: ${data.session.user.email}`);
                } else {
                    setDebug(prev => `${prev}\nNo active session found`);
                }
            } catch (err) {
                setDebug(prev => `${prev}\nUnexpected error checking session: ${err}`);
            }
        };

        checkSession();
    }, [searchParams]);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        setDebug('Starting Google OAuth flow...');

        try {
            // Clear any existing auth state
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                    key.startsWith('supabase.auth.') ||
                    key.includes('code_verifier')
                )) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
            setDebug(prev => `${prev}\nCleared auth state before Google login`);

            // Add a small delay to ensure clearing is complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get the current URL for the redirect
            const currentOrigin = window.location.origin;
            setDebug(prev => `${prev}\nCurrent origin for redirect: ${currentOrigin}`);

            // Add redirectTo option with current origin
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${currentOrigin}/auth-debug`,
                }
            });

            if (error) throw error;

            setDebug(prev => `${prev}\nGoogle OAuth initiated, redirecting to Google...`);
            if (data?.url) {
                setDebug(prev => `${prev}\nRedirect URL: ${data.url}`);
            }
        } catch (error) {
            console.error('Google login error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred during Google login');
            setDebug(prev => `${prev}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsLoading(false);
        }
    };

    const handleExchangeCode = async () => {
        const code = searchParams.get('code');
        if (!code) {
            setDebug(prev => `${prev}\nNo code parameter found in URL`);
            return;
        }

        setDebug(prev => `${prev}\nAttempting to exchange code for session...`);
        try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                setDebug(prev => `${prev}\nError exchanging code: ${error.message}`);
                return;
            }

            setDebug(prev => `${prev}\nSuccessfully exchanged code for session`);
            setSession(data.session);

            // Clear the code from the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            setDebug(prev => `${prev}\nCleared code from URL`);
        } catch (err) {
            setDebug(prev => `${prev}\nUnexpected error exchanging code: ${err}`);
        }
    };

    const clearAuthState = () => {
        // Clear all localStorage
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('supabase') ||
                key.includes('auth') ||
                key.includes('sb-')
            )) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear cookies
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (name) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
            }
        });

        setDebug(prev => `${prev}\nManually cleared all auth state`);

        // Force reload
        window.location.href = '/auth-debug';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        Auth Debug Page
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={handleGoogleLogin}
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting to Google...
                                </>
                            ) : (
                                'Sign in with Google'
                            )}
                        </Button>

                        {searchParams.get('code') && (
                            <Button
                                onClick={handleExchangeCode}
                                variant="outline"
                                className="w-full"
                            >
                                Exchange Code for Session
                            </Button>
                        )}

                        <Button
                            onClick={clearAuthState}
                            variant="outline"
                            className="w-full"
                        >
                            Clear Auth State
                        </Button>
                    </div>

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    {session && (
                        <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                            <strong>Session Active:</strong> {session.user.email}
                        </div>
                    )}

                    {debug && (
                        <div className="p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md whitespace-pre-wrap">
                            <strong>Debug Info:</strong>
                            {debug}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 