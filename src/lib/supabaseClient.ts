import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '../types/supabase';

// Function to create a Supabase client with options
const createSupabaseClient = () => {
    // Check if we're on the login page and should disable auto session restoration
    const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';

    // If on login page, create client with session restoration disabled
    if (isLoginPage) {
        // Clear any existing auth data first
        if (typeof localStorage !== 'undefined') {
            const keysToRemove = [];
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
            console.log('Cleared auth state before creating Supabase client');
        }

        // Create client with auto session restoration disabled
        return createClientComponentClient<Database>({
            options: {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: false, // Disable automatic detection of auth codes in URL
                }
            }
        });
    }

    // For other pages, use default behavior
    return createClientComponentClient<Database>();
};

// Create a single instance of the Supabase client to be used throughout the app
export const supabase = createSupabaseClient();

// Export a function to get the current session
export const getCurrentSession = async () => {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error('Error getting session:', error.message);
            return null;
        }
        return data.session;
    } catch (err) {
        console.error('Unexpected error getting session:', err);
        return null;
    }
};

// Export a function to refresh the session if needed
export const refreshSessionIfNeeded = async () => {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Error getting session for refresh check:', error.message);
            return null;
        }

        if (!data.session) {
            return null;
        }

        // Check if session is about to expire (within 10 minutes)
        const expiresAt = data.session.expires_at ? data.session.expires_at * 1000 : 0; // convert to milliseconds
        const now = Date.now();
        const tenMinutesInMs = 10 * 60 * 1000;

        if (expiresAt - now < tenMinutesInMs) {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
                console.error('Error refreshing session:', refreshError.message);
                return null;
            }

            return refreshData.session;
        }

        return data.session;
    } catch (err) {
        console.error('Unexpected error refreshing session:', err);
        return null;
    }
};