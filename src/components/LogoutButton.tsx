'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/src/lib/supabaseClient';
import { useToast } from './ui/use-toast';
import { Button } from './ui/button';
import { LogOut, Loader2 } from 'lucide-react';

interface LogoutButtonProps {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    className?: string;
}

const LogoutButton = ({
    variant = 'outline',
    size = 'default',
    className = ''
}: LogoutButtonProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        setIsLoading(true);

        try {
            // Sign out from Supabase with scope: 'global' to clear all sessions
            const { error } = await supabase.auth.signOut({ scope: 'global' });

            if (error) {
                console.error('Logout error:', error.message);
                toast({
                    title: 'Logout failed',
                    description: error.message,
                    variant: 'destructive',
                });
                return;
            }

            // Clear all Supabase auth-related items from localStorage
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                    key.startsWith('supabase.') ||
                    key.includes('supabase') ||
                    key.includes('sb-') ||
                    key.includes('auth')
                )) {
                    keysToRemove.push(key);
                }
            }

            // Remove the keys after collecting them
            keysToRemove.forEach(key => localStorage.removeItem(key));

            // Also clear cookies related to authentication
            document.cookie.split(';').forEach(cookie => {
                const [name] = cookie.trim().split('=');
                if (name && (
                    name.includes('supabase') ||
                    name.includes('sb-') ||
                    name.includes('auth')
                )) {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
                }
            });

            toast({
                title: 'Logged out',
                description: 'You have been logged out successfully',
            });

            // Force a hard refresh to clear any in-memory state
            window.location.href = '/';
        } catch (error) {
            console.error('Unexpected error during logout:', error);
            toast({
                title: 'Logout failed',
                description: 'An unexpected error occurred. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleLogout}
            disabled={isLoading}
            className={className}
        >
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging out...
                </>
            ) : (
                <>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </>
            )}
        </Button>
    );
};

export default LogoutButton; 