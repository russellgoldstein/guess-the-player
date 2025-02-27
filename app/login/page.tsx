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
import Link from 'next/link';
import { GoogleSignIn } from '@/src/components/GoogleSignIn';
import { Separator } from '@/src/components/ui/separator';

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
                const { data: { session } } = await supabase.auth.getSession();

                if (session) {
                    toast({
                        title: "Already logged in",
                        description: "You are already logged in",
                    });
                    router.push('/');
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
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                console.error('Login error:', error);
                throw error;
            }

            // Verify the session was created
            const { data: { session } } = await supabase.auth.getSession();


            if (session) {
                // Check if cookies were set properly

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
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex flex-col items-center">
                <div className="w-64 h-64 mb-0">
                    <img
                        src="/images/logo.svg"
                        alt="Stat Attack Logo"
                        width={144}
                        height={144}
                        className="w-full h-full"
                    />
                </div>
                <Link href="/" className="text-2xl font-bold text-mlb-blue -mt-4">
                    Stat Attack
                </Link>
            </div>

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
                            className="w-full bg-mlb-blue hover:bg-mlb-blue/90 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <span className="text-white">Sign In</span>
                            )}
                        </Button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>

                    <GoogleSignIn />

                    <p className="text-center text-sm text-gray-600 mt-4">
                        Don't have an account?{' '}
                        <a href="/create-account" className="text-mlb-blue hover:underline">
                            Create one here
                        </a>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;