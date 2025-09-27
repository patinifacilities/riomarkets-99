import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  total: number;
}

export class RateLimiter {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async checkRateLimit(
    identifier: string, // user_id or ip_address
    endpoint: string,
    config: RateLimitConfig,
    isUserBased = true
  ): Promise<RateLimitResult> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);
    
    try {
      // Clean up old records first
      await this.supabase
        .from('rate_limits')
        .delete()
        .lt('window_start', windowStart.toISOString());

      // Get current count for this identifier and endpoint
      const { data: existing, error: fetchError } = await this.supabase
        .from('rate_limits')
        .select('*')
        .eq(isUserBased ? 'user_id' : 'ip_address', identifier)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString())
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Rate limit fetch error:', fetchError);
        // Fail open - allow request if we can't check
        return {
          allowed: true,
          remaining: config.limit - 1,
          resetTime: new Date(now.getTime() + config.windowMs),
          total: config.limit
        };
      }

      if (!existing) {
        // First request in window - create new record
        const { error: insertError } = await this.supabase
          .from('rate_limits')
          .insert({
            [isUserBased ? 'user_id' : 'ip_address']: identifier,
            endpoint,
            requests_count: 1,
            window_start: now.toISOString()
          });

        if (insertError) {
          console.error('Rate limit insert error:', insertError);
          // Fail open
          return {
            allowed: true,
            remaining: config.limit - 1,
            resetTime: new Date(now.getTime() + config.windowMs),
            total: config.limit
          };
        }

        return {
          allowed: true,
          remaining: config.limit - 1,
          resetTime: new Date(existing?.window_start ? new Date(existing.window_start).getTime() + config.windowMs : now.getTime() + config.windowMs),
          total: config.limit
        };
      }

      // Check if limit exceeded
      if (existing.requests_count >= config.limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(new Date(existing.window_start).getTime() + config.windowMs),
          total: config.limit
        };
      }

      // Increment count
      const { error: updateError } = await this.supabase
        .from('rate_limits')
        .update({ 
          requests_count: existing.requests_count + 1,
          updated_at: now.toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Rate limit update error:', updateError);
        // Fail open
        return {
          allowed: true,
          remaining: config.limit - existing.requests_count - 1,
          resetTime: new Date(new Date(existing.window_start).getTime() + config.windowMs),
          total: config.limit
        };
      }

      return {
        allowed: true,
        remaining: config.limit - existing.requests_count - 1,
        resetTime: new Date(new Date(existing.window_start).getTime() + config.windowMs),
        total: config.limit
      };

    } catch (error) {
      console.error('Rate limit check error:', error);
      // Fail open - allow request if rate limiting fails
      return {
        allowed: true,
        remaining: config.limit - 1,
        resetTime: new Date(now.getTime() + config.windowMs),
        total: config.limit
      };
    }
  }

  static createHeaders(result: RateLimitResult): Record<string, string> {
    return {
      'X-RateLimit-Limit': result.total.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetTime.getTime() / 1000).toString(),
      ...(result.allowed ? {} : { 'Retry-After': Math.ceil((result.resetTime.getTime() - Date.now()) / 1000).toString() })
    };
  }
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  'exchange-convert': { limit: 10, windowMs: 60 * 1000 }, // 10 per minute
  'get-orderbook': { limit: 60, windowMs: 60 * 1000 }, // 60 per minute
  'get-rate': { limit: 120, windowMs: 60 * 1000 }, // 120 per minute
  'reconcile-balances': { limit: 1, windowMs: 60 * 60 * 1000 }, // 1 per hour
  default: { limit: 30, windowMs: 60 * 1000 } // 30 per minute default
};