// app/create-account/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabaseClient';
import { Input } from "../../src/components/ui/input";
import { Button } from "../../src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Loader2 } from "lucide-react";
import { Separator } from "../../src/components/ui/separator";

const CreateAccountPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });

            if (signUpError) throw signUpError;

            const userId = signUpData.user?.id;
            if (!userId) throw new Error('No user ID returned from signup');

            const { error: insertError } = await supabase
                .from('users')
                .insert([{ id: userId, email, username: email }]);

            if (insertError) throw insertError;

            router.push('/login?message=Account created successfully. Please check your email to verify your account.');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during account creation');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setIsGoogleLoading(true);
        setError(null);

        try {
            // First, clear any existing auth state
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
            console.log('Cleared auth state before Google signup');

            // Add a small delay to ensure clearing is complete
            await new Promise(resolve => setTimeout(resolve, 100));

            // Get the current URL for the redirect
            const currentOrigin = window.location.origin;
            console.log(`Current origin for redirect: ${currentOrigin}`);

            // Add redirectTo option with current origin
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${currentOrigin}/`,
                }
            });

            if (error) throw error;

            console.log('Google OAuth initiated, redirecting to Google...');
            // The user will be redirected to Google for authentication
            // No need to navigate or show success message here
        } catch (error) {
            console.error('Google signup error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred during Google signup');
            setIsGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center text-mlb-blue">
                        Create Account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your details to create a new account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreateAccount} className="space-y-4">
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
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                <span className="text-white">Create Account</span>
                            )}
                        </Button>

                        <div className="relative my-4">
                            <Separator />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="bg-gray-50 px-2 text-sm text-gray-500">OR</span>
                            </div>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-gray-300 flex items-center justify-center gap-2"
                            onClick={handleGoogleSignUp}
                            disabled={isLoading || isGoogleLoading}
                        >
                            {isGoogleLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Connecting to Google...
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" className="w-5 h-5">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Sign up with Google
                                </>
                            )}
                        </Button>

                        <p className="text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <a href="/login" className="text-mlb-blue hover:underline">
                                Sign in here
                            </a>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateAccountPage;