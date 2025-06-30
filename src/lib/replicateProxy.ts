import { supabase } from './supabase';

export interface ProxyTransformRequest {
  audioBase64: string;
  style: string;
  parameters?: {
    duration?: number;
    temperature?: number;
    prompt?: string;
    continuation?: boolean;
  };
}

export interface ProxyTransformResponse {
  success: boolean;
  prediction_id?: string;
  status?: string;
  urls?: any;
  error?: string;
}

export interface ProxyStatusResponse {
  success: boolean;
  id?: string;
  status?: string;
  output?: string | string[];
  error?: string;
  logs?: string;
  created_at?: string;
  started_at?: string;
  completed_at?: string;
}

class ReplicateProxy {
  private getSupabaseUrl(): string {
    const url = import.meta.env.VITE_SUPABASE_URL;
    if (!url) {
      throw new Error('Supabase URL not configured');
    }
    return url;
  }

  private getHeaders(): Record<string, string> {
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${anonKey}`,
      'apikey': anonKey || '',
    };
  }

  async createTransformation(request: ProxyTransformRequest): Promise<ProxyTransformResponse> {
    try {
      console.log('🚀 Creating AI transformation via proxy...');
      console.log('📍 Style:', request.style);
      console.log('📍 Parameters:', request.parameters);

      const supabaseUrl = this.getSupabaseUrl();
      const url = `${supabaseUrl}/functions/v1/ai-transform`;

      console.log('📍 Proxy URL:', url);

      // Ensure the audioBase64 is properly formatted
      // If it's a data URL, keep it as is; otherwise, add the data URL prefix
      if (!request.audioBase64.startsWith('data:')) {
        request.audioBase64 = `data:audio/wav;base64,${request.audioBase64.replace(/^data:.*?;base64,/, '')}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      console.log('📡 Proxy response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Proxy error response:', errorText);
        throw new Error(`Proxy request failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Proxy response:', result);

      return result;
    } catch (error) {
      console.error('❌ Proxy transformation error:', error);
      throw error;
    }
  }

  async getTransformationStatus(predictionId: string): Promise<ProxyStatusResponse> {
    try {
      console.log('🔍 Checking transformation status via proxy:', predictionId);

      const supabaseUrl = this.getSupabaseUrl();
      const url = `${supabaseUrl}/functions/v1/ai-status?id=${encodeURIComponent(predictionId)}`;

      console.log('📍 Status URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      console.log('📡 Status response:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Status error response:', errorText);
        throw new Error(`Status request failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Status result:', result);

      return result;
    } catch (error) {
      console.error('❌ Status check error:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🧪 Testing proxy connection...');
      
      // First try the api-test endpoint if available
      const supabaseUrl = this.getSupabaseUrl();
      const url = `${supabaseUrl}/functions/v1/api-test`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: this.getHeaders(),
        });
        
        console.log('📡 API test response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          return result.success === true;
        }
      } catch (e) {
        console.log('API test endpoint not available, trying status endpoint');
      }
      
      // Fall back to the status endpoint
      const statusUrl = `${supabaseUrl}/functions/v1/ai-status?id=test`;
      
      const response = await fetch(statusUrl, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      console.log('📡 Test response status:', response.status);
      
      // Any response means the proxy is accessible
      return response.status < 600; 
    } catch (error) {
      console.error('❌ Proxy connection test failed:', error);
      return false;
    }
  }
}

export const replicateProxy = new ReplicateProxy();