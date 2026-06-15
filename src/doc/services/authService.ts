
import { UserProfile } from "../types";
import { supabase } from "./supabaseClient";

const LOCAL_USER_KEY = 'chornor_local_user';

export const subscribeToAuth = (callback: (user: UserProfile | null) => void) => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
            callback(mapSupabaseUser(session.user));
        } else {
            // Fallback to Local Storage for Guest/Test users
            const local = localStorage.getItem(LOCAL_USER_KEY);
            if (local) {
                try {
                    callback(JSON.parse(local));
                } catch (e) {
                    callback(null);
                }
            } else {
                callback(null);
            }
        }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
            callback(mapSupabaseUser(session.user));
        } else {
             // If signed out of Supabase, check if we have a local user (unlikely to happen in same session flow, but good for safety)
             const local = localStorage.getItem(LOCAL_USER_KEY);
             if (local) {
                 try {
                     callback(JSON.parse(local));
                 } catch (e) {
                     callback(null);
                 }
             } else {
                 callback(null);
             }
        }
    });

    return () => subscription.unsubscribe();
};

const mapSupabaseUser = (user: any): UserProfile => {
    const email = user.email || '';
    // Hardcoded Super Admin check for simplicity
    const isSuperAdmin = email === 'sengtha@gmail.com'; 
    return {
        id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: email,
        picture: user.user_metadata?.avatar_url,
        isTestUser: false,
        isAdmin: isSuperAdmin
    };
};

export const loginWithGoogle = async (): Promise<void> => {
    const redirectUrl = window.location.origin;
    console.log("Supabase Auth: Redirecting to", redirectUrl);

    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl
        }
    });
    if (error) throw error;
};

export const createLocalUser = async (name: string, isAdmin: boolean = false): Promise<void> => {
    const user: UserProfile = {
        id: `local_${Date.now()}`,
        name: name || 'Guest User',
        email: isAdmin ? 'admin@local.dev' : 'guest@local.dev',
        isTestUser: true,
        isAdmin: isAdmin
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
    // Reload to pick up the new local user state in the main App
    window.location.reload();
};

export const loginWithGoogleCredential = async (credential: string): Promise<void> => {
    await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: credential,
    });
};

export const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    localStorage.removeItem(LOCAL_USER_KEY);
    // Force reload to origin to clear any state/hash fragments
    window.location.href = window.location.origin;
};
