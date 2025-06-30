import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle, Loader2, Info, ExternalLink, Settings } from 'lucide-react';
import { replicateProxy } from '../../lib/replicateProxy';

interface ConnectionTestResult {
  status: 'testing' | 'connected' | 'failed' | 'warning';
  message: string;
  details?: string;
  timestamp: Date;
  isOfflineTest?: boolean;
}

const APIConnectionTest: React.FC = () => {
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [isManualTesting, setIsManualTesting] = useState(false);

  const testConnection = async (isManual: boolean = false) => {
    if (isManual) {
      setIsManualTesting(true);
    }

    setTestResult({
      status: 'testing',
      message: 'Testing Supabase Edge Functions and Replicate API...',
      timestamp: new Date()
    });

    try {
      console.log('🧪 Starting comprehensive API connection test...');
      
      // Test the proxy connection
      const isConnected = await replicateProxy.testConnection();
      
      if (isConnected) {
        setTestResult({
          status: 'connected',
          message: 'Successfully connected to AI transformation service',
          details: 'Supabase Edge Functions are deployed and Replicate API key is configured correctly',
          timestamp: new Date()
        });
        console.log('✅ Full API connection test passed');
      } else {
        throw new Error('Connection test failed');
      }
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      
      let errorMessage = 'Connection failed';
      let errorDetails = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('not configured')) {
          errorDetails = 'The Replicate API key needs to be added to Supabase Edge Function secrets and the functions need to be deployed.';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorDetails = 'Network error - check if Edge Functions are deployed to your Supabase project.';
        } else if (error.message.includes('401') || error.message.includes('authentication')) {
          errorDetails = 'Invalid API key - verify your Replicate token in Supabase secrets.';
        } else if (error.message.includes('403')) {
          errorDetails = 'API access denied - check your Replicate account permissions.';
        } else if (error.message.includes('429')) {
          errorDetails = 'Rate limit exceeded - try again in a few minutes.';
        } else if (error.message.includes('500')) {
          errorDetails = 'Server error - Edge Functions may need to be deployed or redeployed.';
        } else {
          errorDetails = 'Check the browser console for detailed error messages.';
        }
      }
      
      setTestResult({
        status: 'failed',
        message: errorMessage,
        details: errorDetails,
        timestamp: new Date()
      });
    } finally {
      if (isManual) {
        setIsManualTesting(false);
      }
    }
  };

  // Test connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  const getStatusIcon = () => {
    if (!testResult) return <Loader2 className="h-5 w-5 animate-spin text-gray-400" />;
    
    switch (testResult.status) {
      case 'testing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-400" />;
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <Info className="h-5 w-5 text-yellow-400" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <WifiOff className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!testResult) return 'text-gray-400';
    
    switch (testResult.status) {
      case 'testing': return 'text-blue-400';
      case 'connected': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusMessage = () => {
    if (!testResult) return 'Initializing...';
    return testResult.message;
  };

  const getStatusTitle = () => {
    if (!testResult) return 'Initializing...';
    
    switch (testResult.status) {
      case 'testing': return 'Testing Connection...';
      case 'connected': return 'Connected';
      case 'warning': return 'Warning';
      case 'failed': return 'Connection Failed';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-dark-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Wifi className="h-6 w-6 text-neon-blue" />
          <h2 className="font-righteous text-xl text-neon-blue">AI Service Connection Test</h2>
        </div>
        <button
          onClick={() => testConnection(true)}
          disabled={isManualTesting || testResult?.status === 'testing'}
          className="flex items-center space-x-2 px-4 py-2 bg-dark-700 border border-gray-600 rounded-lg hover:border-neon-blue transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${isManualTesting ? 'animate-spin' : ''}`} />
          <span className="text-sm text-gray-300">Test Again</span>
        </button>
      </div>

      {/* Connection Status */}
      <div className={`rounded-xl p-4 mb-4 ${
        testResult?.status === 'connected' ? 'bg-green-900/20 border border-green-500/30' :
        testResult?.status === 'warning' ? 'bg-yellow-900/20 border border-yellow-500/30' :
        testResult?.status === 'failed' ? 'bg-red-900/20 border border-red-500/30' :
        'bg-dark-700/50'
      }`}>
        <div className="flex items-center space-x-3 mb-2">
          {getStatusIcon()}
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusTitle()}
          </span>
        </div>
        
        <p className="text-gray-300 mb-2">{getStatusMessage()}</p>
        
        {testResult?.details && (
          <p className="text-sm text-gray-400">{testResult.details}</p>
        )}
        
        {testResult?.timestamp && (
          <p className="text-xs text-gray-500 mt-2">
            Last tested: {testResult.timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* API Key Status */}
      <div className="bg-dark-700/50 rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-white mb-2">Configuration Status</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Local API Key:</span>
            <span className={`text-sm ${import.meta.env.VITE_REPLICATE_API_TOKEN ? 'text-green-400' : 'text-red-400'}`}>
              {import.meta.env.VITE_REPLICATE_API_TOKEN ? 'Configured' : 'Missing'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Supabase Edge Functions:</span>
            <span className={`text-sm ${testResult?.status === 'connected' ? 'text-green-400' : 'text-yellow-400'}`}>
              {testResult?.status === 'connected' ? 'Deployed & Working' : 'Needs Deployment'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Environment:</span>
            <span className="text-sm text-blue-400">
              {import.meta.env.MODE || 'development'}
            </span>
          </div>
        </div>
      </div>

      {/* Deployment Instructions */}
      {testResult?.status === 'failed' && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-4">
          <h3 className="font-semibold text-blue-400 mb-2">Deployment Required</h3>
          <p className="text-sm text-blue-300 mb-3">
            Your Replicate API key is configured in Supabase, but the Edge Functions need to be deployed to access it.
          </p>
          
          <div className="space-y-2">
            <h4 className="font-medium text-blue-300">Deploy using Supabase CLI:</h4>
            <div className="bg-dark-700 rounded p-2 text-xs font-mono text-gray-300">
              <div>npm install -g supabase</div>
              <div>supabase login</div>
              <div>supabase functions deploy ai-transform</div>
              <div>supabase functions deploy ai-status</div>
            </div>
          </div>
          
          <div className="mt-3">
            <a 
              href="https://supabase.com/docs/guides/functions/deploy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-neon-blue hover:text-neon-purple transition-colors duration-200 inline-flex items-center space-x-1 text-sm"
            >
              <span>View Deployment Guide</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Success Info */}
      {testResult?.status === 'connected' && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4">
          <h3 className="font-semibold text-green-400 mb-2">Ready for AI Transformations</h3>
          <p className="text-sm text-green-300">
            Your AI transformation service is properly configured and ready to use. You can now transform voice recordings into different musical styles.
          </p>
        </div>
      )}
    </div>
  );
};

export default APIConnectionTest;