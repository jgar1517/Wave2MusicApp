import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export interface UsageLimit {
  resource_type: string;
  limit_value: number;
  limit_unit: string;
  reset_period: string;
}

export interface UsageRecord {
  id: string;
  user_id: string;
  resource_type: string;
  quantity: number;
  billing_period: string;
  created_at: string;
}

interface SubscriptionState {
  limits: UsageLimit[];
  usage: UsageRecord[];
  loading: boolean;
  error: string | null;
  
  // Usage tracking
  trackUsage: (resourceType: string, quantity?: number) => Promise<boolean>;
  checkUsageLimit: (resourceType: string) => Promise<boolean>;
  getCurrentUsage: (resourceType: string) => number;
  getUsageLimit: (resourceType: string) => number;
  
  // Data loading
  loadLimits: () => Promise<void>;
  loadUsage: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  limits: [],
  usage: [],
  loading: false,
  error: null,

  trackUsage: async (resourceType: string, quantity: number = 1) => {
    const { user } = useAuthStore.getState();
    if (!user) return false;

    try {
      // Check if usage is within limits first
      const canUse = await get().checkUsageLimit(resourceType);
      if (!canUse) {
        return false;
      }

      const billingPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const { error } = await supabase
        .from('usage_tracking')
        .insert([
          {
            user_id: user.id,
            resource_type: resourceType,
            quantity,
            billing_period: billingPeriod,
          }
        ]);

      if (error) throw error;

      // Reload usage data
      await get().loadUsage();
      return true;
    } catch (error) {
      console.error('Error tracking usage:', error);
      set({ error: 'Failed to track usage' });
      return false;
    }
  },

  checkUsageLimit: async (resourceType: string) => {
    const { profile } = useAuthStore.getState();
    if (!profile) return false;

    const currentUsage = get().getCurrentUsage(resourceType);
    const limit = get().getUsageLimit(resourceType);

    // -1 means unlimited
    if (limit === -1) return true;
    
    return currentUsage < limit;
  },

  getCurrentUsage: (resourceType: string) => {
    const { user } = useAuthStore.getState();
    if (!user) return 0;

    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    return get().usage
      .filter(record => 
        record.user_id === user.id &&
        record.resource_type === resourceType &&
        record.billing_period === currentPeriod
      )
      .reduce((total, record) => total + record.quantity, 0);
  },

  getUsageLimit: (resourceType: string) => {
    const { profile } = useAuthStore.getState();
    if (!profile) return 0;

    const limit = get().limits.find(l => 
      l.resource_type === resourceType
    );

    // Default limits based on subscription tier
    const defaultLimits: Record<string, Record<string, number>> = {
      free: {
        ai_transformations: 5,
        exports: 10,
        storage_mb: 100,
        projects: 3,
      },
      pro: {
        ai_transformations: 50,
        exports: -1, // unlimited
        storage_mb: 1000,
        projects: -1, // unlimited
      },
      enterprise: {
        ai_transformations: -1, // unlimited
        exports: -1, // unlimited
        storage_mb: -1, // unlimited
        projects: -1, // unlimited
      },
    };

    return limit?.limit_value ?? defaultLimits[profile.subscription_tier]?.[resourceType] ?? 0;
  },

  loadLimits: async () => {
    set({ loading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('subscription_limits')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      set({ limits: data || [], loading: false });
    } catch (error) {
      console.error('Error loading limits:', error);
      set({ error: 'Failed to load subscription limits', loading: false });
    }
  },

  loadUsage: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;

    set({ loading: true, error: null });

    try {
      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', user.id)
        .eq('billing_period', currentPeriod)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ usage: data || [], loading: false });
    } catch (error) {
      console.error('Error loading usage:', error);
      set({ error: 'Failed to load usage data', loading: false });
    }
  },
}));