'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Settings, 
  Cloud, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  Table
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState(false);

  // Listen for OAuth success messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (event.data?.provider === 'google') setIsGoogleConnected(true);
        if (event.data?.provider === 'microsoft') setIsMicrosoftConnected(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async (provider: 'google' | 'microsoft') => {
    try {
      const response = await fetch(`/api/auth/url?provider=${provider}`);
      const { url } = await response.json();
      
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Failed to initiate connection. Please check console.');
    }
  };

  return (
    <div className="max-w-4xl space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-[#141414] tracking-tight">Settings</h1>
        <p className="text-[#141414]/50 italic serif">Manage your account preferences and external integrations.</p>
      </div>

      {/* Profile Section */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414]/10 pb-2">Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-[#141414]/10 p-8">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Full Name</label>
              <p className="text-sm font-bold text-[#141414]">{user?.name}</p>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Email Address</label>
              <p className="text-sm font-bold text-[#141414]">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Role</label>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest">
                <Shield size={12} className="text-[#F27D26]" />
                {user?.role.replace('_', ' ')}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#141414]/40 mb-2">Department</label>
              <p className="text-sm font-bold text-[#141414]">Emergency Medicine</p>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#141414]/10 pb-2">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#141414]">External Integrations</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#141414]/30 italic serif">Admin Only</span>
        </div>
        
        <p className="text-sm text-[#141414]/60 italic serif">
          Connect your cloud storage to automatically backup assessment data to Google Sheets or Microsoft Excel.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Google Integration */}
          <div className={`bg-white border p-8 transition-all ${isGoogleConnected ? 'border-green-500' : 'border-[#141414]/10'}`}>
            <div className="flex items-start justify-between mb-8">
              <div className="p-3 bg-blue-50 rounded text-blue-600">
                <FileSpreadsheet size={24} />
              </div>
              {isGoogleConnected ? (
                <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold uppercase tracking-widest">
                  <CheckCircle2 size={12} />
                  Connected
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[#141414]/30 text-[10px] font-bold uppercase tracking-widest">
                  <AlertCircle size={12} />
                  Disconnected
                </div>
              )}
            </div>
            <h4 className="text-lg font-bold text-[#141414] mb-2">Google Sheets</h4>
            <p className="text-xs text-[#141414]/50 italic serif mb-8">
              Sync assessment results directly to a designated Google Sheet for advanced reporting.
            </p>
            <button 
              onClick={() => handleConnect('google')}
              className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isGoogleConnected 
                  ? 'border border-[#141414]/10 text-[#141414]/40 hover:text-red-500 hover:border-red-500' 
                  : 'bg-[#141414] text-white hover:bg-[#F27D26]'
              }`}
            >
              {isGoogleConnected ? 'Disconnect Account' : 'Connect Google Account'}
              {!isGoogleConnected && <ExternalLink size={12} />}
            </button>
          </div>

          {/* Microsoft Integration */}
          <div className={`bg-white border p-8 transition-all ${isMicrosoftConnected ? 'border-green-500' : 'border-[#141414]/10'}`}>
            <div className="flex items-start justify-between mb-8">
              <div className="p-3 bg-emerald-50 rounded text-emerald-600">
                <Table size={24} />
              </div>
              {isMicrosoftConnected ? (
                <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold uppercase tracking-widest">
                  <CheckCircle2 size={12} />
                  Connected
                </div>
              ) : (
                <div className="flex items-center gap-1 text-[#141414]/30 text-[10px] font-bold uppercase tracking-widest">
                  <AlertCircle size={12} />
                  Disconnected
                </div>
              )}
            </div>
            <h4 className="text-lg font-bold text-[#141414] mb-2">Microsoft Excel</h4>
            <p className="text-xs text-[#141414]/50 italic serif mb-8">
              Export data to OneDrive/SharePoint Excel workbooks for organizational compliance.
            </p>
            <button 
              onClick={() => handleConnect('microsoft')}
              className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isMicrosoftConnected 
                  ? 'border border-[#141414]/10 text-[#141414]/40 hover:text-red-500 hover:border-red-500' 
                  : 'bg-[#141414] text-white hover:bg-[#F27D26]'
              }`}
            >
              {isMicrosoftConnected ? 'Disconnect Account' : 'Connect Microsoft Account'}
              {!isMicrosoftConnected && <ExternalLink size={12} />}
            </button>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414]/10 pb-2">Security & Privacy</h3>
        <div className="bg-[#141414] text-white p-8">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[#F27D26] mb-4">Data Protection Notice</h4>
          <p className="text-sm opacity-80 italic serif leading-relaxed mb-6">
            &quot;All assessment data is encrypted at rest and in transit. External integrations use OAuth 2.0 to ensure your credentials are never stored on our servers.&quot;
          </p>
          <div className="flex items-center gap-4">
            <button className="text-[10px] font-bold uppercase tracking-widest border border-white/20 px-4 py-2 hover:bg-white/10 transition-all">
              Audit Logs
            </button>
            <button className="text-[10px] font-bold uppercase tracking-widest border border-white/20 px-4 py-2 hover:bg-white/10 transition-all">
              Privacy Policy
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
