'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabaseClient';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

// Debug log to verify environment variables are loaded
console.log('Google Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

declare global {
    interface Window {
        google: any;
        googleOneTapLoaded: boolean;
    }
}

export const GoogleSignIn = () => {
    const router = useRouter();
    const { toast } = useToast();
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const scriptLoadedRef = useRef(false);

    const handleGoogleSignIn = async (response: any) => {
        try {
            const { data, error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
            });

            if (error) throw error;

            toast({
                title: 'Login successful',
                description: 'You have been logged in with Google successfully',
            });

            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Error signing in with Google:', error);
            toast({
                title: 'Login failed',
                description: error instanceof Error ? error.message : 'Failed to sign in with Google',
                variant: 'destructive',
            });
        }
    };

    useEffect(() => {
        if (!googleButtonRef.current || scriptLoadedRef.current) return;

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
            window.google?.accounts.id.initialize({
                client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
                callback: handleGoogleSignIn,
                auto_select: false,
                cancel_on_tap_outside: true,
            });

            window.google?.accounts.id.renderButton(googleButtonRef.current!, {
                theme: 'outline',
                size: 'large',
                type: 'standard',
                text: 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'left',
                width: 280,
            });

            scriptLoadedRef.current = true;
        };

        document.head.appendChild(script);

        return () => {
            if (window.google?.accounts) {
                window.google.accounts.id.cancel();
            }
            document.head.removeChild(script);
            scriptLoadedRef.current = false;
        };
    }, [router, toast]);

    return (
        <div className="flex flex-col items-center w-full">
            <div
                ref={googleButtonRef}
                className="flex justify-center items-center min-h-[40px]"
            />
        </div>
    );
}; 