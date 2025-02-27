'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { PageWrapper } from '@/src/components/PageWrapper';
import { Circle, PlusCircle, Shuffle } from 'lucide-react';
import { UserGamesList } from '@/src/components/UserGamesList';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabaseClient';
import { useToast } from '@/src/components/ui/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';

// Loading fallback component
const HomePageLoading = () => (
  <div className="container mx-auto px-4 py-12">
    <div className="flex flex-col items-center justify-center gap-8">
      <div className="text-center">
        <div className="flex justify-center mb-0">
          <div className="w-64 h-64">
            <img
              src="/images/logo.svg"
              alt="Stat Attack Logo"
              width={192}
              height={192}
              className="w-full h-full"
            />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-mlb-blue mb-4 -mt-4">
          Stat Attack
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Loading...
        </p>
      </div>
    </div>
  </div>
);

// Inner component that uses useSearchParams
const HomePageContent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        setIsLoading(true);

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          toast({
            title: "Authentication Error",
            description: "There was a problem checking your login status",
            variant: "destructive",
          });
          setUser(null);
          return;
        }

        if (session) {
          // Check if the session is about to expire (within 10 minutes)
          const expiresAt = session.expires_at! * 1000;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;

          if (timeUntilExpiry < 600000) { // Less than 10 minutes
            const { error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
              console.error('Error refreshing session:', refreshError);
            }
          }
        }

        setUser(session?.user || null);
      } catch (error) {
        console.error('Error checking user session:', error);
        toast({
          title: "Error",
          description: "There was a problem checking your login status",
          variant: "destructive",
        });
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  useEffect(() => {
    // Check if this is a callback from OAuth
    const code = searchParams.get('code');
    const linkAccounts = searchParams.get('link_accounts') === 'true';

    if (code) {
      const handleAuthCallback = async () => {
        try {
          console.log('Detected auth callback with code');

          // Exchange the code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('Error exchanging code for session:', error);
            toast({
              title: "Authentication Error",
              description: "There was a problem completing your login",
              variant: "destructive",
            });
            return;
          }

          console.log('Successfully exchanged code for session');

          // Clear the code from the URL
          window.history.replaceState({}, document.title, window.location.pathname);

          // Show success message
          toast({
            title: "Login Successful",
            description: "You have been successfully logged in",
          });

          // Force a refresh to update the auth state
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } catch (error) {
          console.error('Error handling auth callback:', error);
          toast({
            title: "Authentication Error",
            description: "There was a problem completing your login",
            variant: "destructive",
          });
          // Clear the code from the URL even if there's an error
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };

      handleAuthCallback();
    }
  }, [searchParams, router, toast]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center gap-8">
        {/* Logo and Hero Section */}
        <div className="text-center">
          <div className="flex justify-center mb-0">
            <div className="w-64 h-64">
              <img
                src="/images/logo.svg"
                alt="Stat Attack Logo"
                width={192}
                height={192}
                className="w-full h-full"
              />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-mlb-blue mb-4 -mt-4">
            Stat Attack
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Guess players based on their stats and challenge your friends
          </p>
        </div>

        {/* User Games List or Account Section */}
        <div className="mt-8 w-full max-w-4xl">
          {isLoading ? (
            <div className="text-center p-8">
              <p className="text-gray-500">Loading user data...</p>
            </div>
          ) : user ? (
            <>
              <UserGamesList user={user} />

              {/* Debug button to manually clear auth state */}
              <div className="mt-4 w-full max-w-md mx-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-gray-500 border-gray-300"
                  onClick={() => {
                    // Clear all localStorage
                    const keysToRemove = [];
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

                    console.log('Manually cleared all auth state from home page');
                    toast({
                      title: "Auth state cleared",
                      description: "All authentication data has been cleared",
                    });

                    // Force reload
                    window.location.href = '/';
                  }}
                >
                  Clear Auth State (Debug)
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center bg-gray-50 p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">
                Track Your Progress
              </h3>
              <p className="text-gray-600 mb-6">
                Sign in to save your games, track your history, and compete with friends
              </p>
              <div className="flex gap-6 justify-center">
                <Link href="/login">
                  <Button variant="outline" size="lg" className="font-medium px-8">
                    Login
                  </Button>
                </Link>
                <Link href="/create-account">
                  <Button variant="default" size="lg" className="font-medium px-8 bg-mlb-blue hover:bg-blue-700 text-white">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main component with Suspense boundary
export default function HomePage() {
  return (
    <PageWrapper>
      <Suspense fallback={<HomePageLoading />}>
        <HomePageContent />
      </Suspense>
    </PageWrapper>
  );
}
