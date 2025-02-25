// app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import { Input } from "../../src/components/ui/input";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card";
import { useToast } from "../../src/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        // Check if user is already logged in
        const checkSession = async () => {
            try {
                setIsCheckingSession(true);
                console.log('Checking for existing session...');
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    console.log('User already logged in:', session.user.id);
                    console.log('Session expires at:', new Date(session.expires_at! * 1000).toISOString());
                    toast({
                        title: "Already logged in",
                        description: "You are already logged in",
                    });
                    router.push('/');
                } else {
                    console.log('No existing session found');
                }
            } catch (error) {
                console.error('Error checking session:', error);
            } finally {
                setIsCheckingSession(false);
            }
        };

        checkSession();
    }, [router, toast]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            console.log('Attempting login for email:', email);
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                console.error('Login error:', error);
                throw error;
            }

            console.log('Login successful for user:', data.user?.id);
            console.log('Session expires at:', new Date(data.session?.expires_at! * 1000).toISOString());

            // Verify the session was created
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Session after login:', session ? 'Valid' : 'Not found');

            if (session) {
                // Check if cookies were set properly
                console.log('Session cookie should be set now');

                toast({
                    title: "Login successful",
                    description: "You have been logged in successfully",
                });

                router.push('/');
                router.refresh(); // Force a refresh to update the UI with the new auth state
            } else {
                console.error('Session not found after login');
                setError('Login succeeded but session was not created. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred during login');

            toast({
                title: "Login failed",
                description: error instanceof Error ? error.message : 'An error occurred during login',
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingSession) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-6 flex justify-center">
                        <div className="flex flex-col items-center space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-mlb-blue" />
                            <p className="text-gray-500">Checking login status...</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-mlb-blue">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-center">
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full"
                                disabled={isLoading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full"
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-mlb-blue hover:bg-mlb-blue/90"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </Button>

                        <p className="text-center text-sm text-gray-600">
                            Don't have an account?{' '}
                            <a href="/create-account" className="text-mlb-blue hover:underline">
                                Create one here
                            </a>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;