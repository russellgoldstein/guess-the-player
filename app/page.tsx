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

  return (
    <PageWrapper>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center gap-12">

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
