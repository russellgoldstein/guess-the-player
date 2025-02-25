'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { PageWrapper } from '@/src/components/PageWrapper';
import { Circle, PlusCircle, Shuffle } from 'lucide-react';
import { UserGamesList } from '@/src/components/UserGamesList';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/src/lib/supabaseClient';
import { useToast } from '@/src/components/ui/use-toast';

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUserSession = async () => {
      try {
        setIsLoading(true);
        console.log('Checking user session on homepage...');
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

        console.log('Session on homepage:', session ? 'Found' : 'Not found');

        if (session) {
          console.log('User ID:', session.user.id);
          console.log('User email:', session.user.email);
          console.log('Session expires at:', new Date(session.expires_at! * 1000).toISOString());

          // Check if the session is about to expire (within 10 minutes)
          const expiresAt = session.expires_at! * 1000;
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;

          console.log('Time until session expiry:', Math.floor(timeUntilExpiry / 60000), 'minutes');

          if (timeUntilExpiry < 600000) { // Less than 10 minutes
            console.log('Session about to expire, refreshing...');
            const { error: refreshError } = await supabase.auth.refreshSession();

            if (refreshError) {
              console.error('Error refreshing session:', refreshError);
            } else {
              console.log('Session refreshed successfully');
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
      console.log('Auth state changed on homepage:', _event);
      console.log('New session:', session ? 'Valid' : 'None');
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-12">
          {/* Hero Section */}
          <div className="text-center max-w-4xl">
            <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-mlb-blue to-blue-600 bg-clip-text text-transparent">
              Guess The Player
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Test your baseball knowledge by trying to identify MLB players from their stats!
              Create custom games or challenge friends with your baseball expertise.
            </p>
          </div>

          {/* Main Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <Link href="/create-game" className="w-full group">
              <div className="relative overflow-hidden rounded-xl transition-all duration-300 group-hover:shadow-xl border-2 border-mlb-blue">
                <div className="absolute inset-0 bg-gradient-to-br from-mlb-blue to-blue-700 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-8 flex flex-col items-center justify-center h-48 text-white">
                  <PlusCircle className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                  <h2 className="text-2xl font-bold mb-2">Create a Game</h2>
                  <p className="text-center text-blue-100">Design your own baseball guessing challenge</p>
                </div>
              </div>
            </Link>

            <Link href="/game/random" className="w-full group">
              <div className="relative overflow-hidden rounded-xl transition-all duration-300 group-hover:shadow-xl border-2 border-green-600">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600 to-green-800 opacity-90 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative p-8 flex flex-col items-center justify-center h-48 text-white">
                  <Shuffle className="h-12 w-12 mb-4 group-hover:scale-110 transition-transform" />
                  <h2 className="text-2xl font-bold mb-2">Play Random Game</h2>
                  <p className="text-center text-green-100">Jump right into a surprise challenge</p>
                </div>
              </div>
            </Link>
          </div>

          {/* User Games List or Account Section */}
          <div className="mt-8 w-full max-w-4xl">
            {isLoading ? (
              <div className="text-center p-8">
                <p className="text-gray-500">Loading user data...</p>
              </div>
            ) : user ? (
              <UserGamesList user={user} />
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
    </PageWrapper>
  );
}
