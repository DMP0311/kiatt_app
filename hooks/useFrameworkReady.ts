import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

export function useFrameworkReady() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session error:', error);
          router.replace('/login');
          return;
        }
        
        // If no session, redirect to login
        if (!session) {
          console.log('No session found, redirecting to login');
          router.replace('/login');
        } else {
          console.log('Session found, user is authenticated');
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.replace('/login');
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        if (event === 'SIGNED_IN' && session) {
          router.replace('/(tabs)');
        } else if (event === 'SIGNED_OUT') {
          router.replace('/login');
        }
      }
    );
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return isReady;
}
