// app/login/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import { Input } from "../../src/components/ui/input";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card";
import { useToast } from "../../src/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import Link from 'next/link';
import { Separator } from "../../src/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../src/components/ui/alert-dialog";

// Loading fallback component
const LoginPageLoading = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
            <CardContent className="pt-6 flex justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-mlb-blue" />
                    <p className="text-gray-500">Loading login page...</p>
                </div>
            </CardContent>
        </Card>
    </div>
);

// Inner component that uses useSearchParams
const LoginPageContent = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showLinkAccountDialog, setShowLinkAccountDialog] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
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

        // Check for error message from OAuth callback
        const errorType = searchParams.get('error_type');
        const errorDescription = searchParams.get('error_description');

        if (errorType === 'email_conflict') {
            setError('An account with this email already exists. Please sign in with your password or use the link accounts option.');
            setEmail(searchParams.get('email') || '');
            setShowLinkAccountDialog(true);
        } else if (errorDescription) {
            setError(errorDescription);
        }

        // Check for success message
        const message = searchParams.get('message');
        if (message) {
            toast({
                title: "Success",
                description: message,
            });
        }
    }, [router, toast, searchParams]);

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

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true);
        setError(null);

        try {
            // Add redirectTo option with current origin
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                }
            });

            if (error) throw error;

            // The user will be redirected to Google for authentication
            // No need to navigate or show success message here
        } catch (error) {
            console.error('Google login error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred during Google login');
            setIsGoogleLoading(false);
        }
    };

    const handleLinkAccounts = async () => {
        if (!email || !password) {
            setError('Please enter your email and password to link accounts');
            return;
        }

        setIsLoading(true);
        try {
            // First sign in with password to get the current user
            const { data: passwordData, error: passwordError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (passwordError) throw passwordError;

            // After successful password login, try Google login again
            const { data: googleData, error: googleError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}?link_accounts=true`,
                }
            });

            if (googleError) throw googleError;

            // The user will be redirected to Google for authentication
        } catch (error) {
            console.error('Error linking accounts:', error);
            setError(error instanceof Error ? error.message : 'An error occurred while linking accounts');
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
        <>
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
                                    "Sign In"
                                )}
                            </Button>
                        </form>

                        <div className="mt-4 text-center">
                            <Link href="/forgot-password" className="text-sm text-mlb-blue hover:underline">
                                Forgot password?
                            </Link>
                        </div>

                        <div className="relative my-6">
                            <Separator />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-white px-2 text-gray-500 text-sm">OR</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleLogin}
                            disabled={isGoogleLoading}
                        >
                            {isGoogleLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting to Google...
                                </>
                            ) : (
                                <>
                                    <img src="/images/google-logo.svg" alt="Google" className="h-5 w-5 mr-2" />
                                    Continue with Google
                                </>
                            )}
                        </Button>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-gray-600">
                                Don't have an account?{" "}
                                <Link href="/register" className="text-mlb-blue hover:underline">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={showLinkAccountDialog} onOpenChange={setShowLinkAccountDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Link Your Accounts</AlertDialogTitle>
                        <AlertDialogDescription>
                            An account with this email already exists. Would you like to link your Google account with your existing account?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleLinkAccounts} disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Linking...
                                </>
                            ) : (
                                "Link Accounts"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

// Main component with Suspense boundary
const LoginPage = () => {
    return (
        <Suspense fallback={<LoginPageLoading />}>
            <LoginPageContent />
        </Suspense>
    );
};

export default LoginPage;