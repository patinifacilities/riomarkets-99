import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useEffect } from 'react';

interface StreakData {
  current_streak: number;
  is_new_login: boolean;
  can_claim_7_day: boolean;
  can_claim_30_day: boolean;
}

interface StreakInfo {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_login_date: string;
  total_logins: number;
  created_at: string;
  updated_at: string;
}

export const useLoginStreak = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Update streak on mount
  const updateStreak = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase.rpc('update_user_login_streak', {
        p_user_id: user.id
      });
      
      if (error) throw error;
      return data[0] as StreakData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['login-streak'] });
    }
  });

  // Get streak info
  const { data: streakInfo, isLoading } = useQuery({
    queryKey: ['login-streak', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_login_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as StreakInfo | null;
    },
    enabled: !!user,
  });

  // Claim reward mutation
  const claimReward = useMutation({
    mutationFn: async ({ rewardType, rewardAmount }: { rewardType: string; rewardAmount: number }) => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase.rpc('claim_daily_reward', {
        p_user_id: user.id,
        p_reward_type: rewardType,
        p_reward_amount: rewardAmount
      });
      
      if (error) throw error;
      if (!data) throw new Error('Failed to claim reward');
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['login-streak'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });

  // Check claimed rewards
  const { data: claimedRewards } = useQuery({
    queryKey: ['claimed-rewards', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('user_rewards_claimed')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Update streak on component mount
  useEffect(() => {
    if (user && !updateStreak.isPending) {
      updateStreak.mutate();
    }
  }, [user]);

  const hasClaimed7Day = claimedRewards?.some(r => r.reward_type === '7_day') || false;
  const hasClaimed30Day = claimedRewards?.some(r => r.reward_type === '30_day') || false;

  const canClaim7Day = (streakInfo?.current_streak || 0) >= 7 && !hasClaimed7Day;
  const canClaim30Day = (streakInfo?.current_streak || 0) >= 30 && !hasClaimed30Day;

  return {
    streakInfo,
    isLoading,
    claimReward: claimReward.mutate,
    isClaiming: claimReward.isPending,
    canClaim7Day,
    canClaim30Day,
    hasClaimed7Day,
    hasClaimed30Day,
  };
};
