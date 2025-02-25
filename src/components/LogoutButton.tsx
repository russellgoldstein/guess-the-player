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
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Logout error:', error.message);
                toast({
                    title: 'Logout failed',
                    description: error.message,
                    variant: 'destructive',
                });
                return;
            }

            toast({
                title: 'Logged out',
                description: 'You have been logged out successfully',
            });

            // Refresh the page to update the UI
            router.push('/');
            router.refresh();
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