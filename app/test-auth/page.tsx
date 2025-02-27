'use client';

import React, { useState } from 'react';
import { supabase } from '../../src/lib/supabaseClient';
import { Button } from "../../src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../src/components/ui/card";
import { Loader2 } from "lucide-react";

export default function TestAuthPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [debug, setDebug] = useState<string>('');

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError(null);
        setDebug('Starting Google OAuth flow...');

        try {
            // Basic OAuth call with no options
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
            });

            if (error) throw error;

            setDebug(prev => `${prev}\nRedirecting to Google...`);
        } catch (error) {
            console.error('Google login error:', error);
            setError(error instanceof Error ? error.message : 'An error occurred during Google login');
            setDebug(prev => `${prev}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">
                        Google OAuth Test
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

                    {error && (
                        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                            {error}
                        </div>
                    )}

                    {debug && (
                        <div className="p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md whitespace-pre-wrap">
                            <strong>Debug Info:</strong>
                            <br />
                            {debug}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 