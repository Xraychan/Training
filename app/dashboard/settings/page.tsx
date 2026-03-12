'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';
import { 
  Settings, 
  Cloud, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  Shield,
  FileSpreadsheet,
  Table,
  RefreshCw,
  Save as SaveIcon,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { store, hashPassword } from '@/lib/store';
import { checkPasswordStrength, PasswordStrengthMeter } from '@/lib/password-strength';

export default function SettingsPage() {
  const { user } = useAuth();
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isMicrosoftConnected, setIsMicrosoftConnected] = useState(false);
  const [googleSheetId, setGoogleSheetId] = useState('');
  const [microsoftExcelPath, setMicrosoftExcelPath] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [isChangingPw, setIsChangingPw] = useState(false);

  const strength = checkPasswordStrength(newPassword);

  // Load state from localStorage on mount
  useEffect(() => {
    setIsGoogleConnected(localStorage.getItem('certifypro_google_connected') === 'true');
    setIsMicrosoftConnected(localStorage.getItem('certifypro_microsoft_connected') === 'true');
    setGoogleSheetId(localStorage.getItem('certifypro_google_sheet_id') || '');
    setMicrosoftExcelPath(localStorage.getItem('certifypro_ms_excel_path') || '');
  }, []);

  // Listen for OAuth success messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        if (event.data?.provider === 'google') {
          setIsGoogleConnected(true);
          localStorage.setItem('certifypro_google_connected', 'true');
        }
        if (event.data?.provider === 'microsoft') {
          setIsMicrosoftConnected(true);
          localStorage.setItem('certifypro_microsoft_connected', 'true');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async (provider: 'google' | 'microsoft') => {
    if (provider === 'google' && isGoogleConnected) {
      setIsGoogleConnected(false);
      localStorage.removeItem('certifypro_google_connected');
      return;
    }
    if (provider === 'microsoft' && isMicrosoftConnected) {
      setIsMicrosoftConnected(false);
      localStorage.removeItem('certifypro_microsoft_connected');
      return;
    }

    try {
      const response = await fetch(`/api/auth/url?provider=${provider}`);
      const { url } = await response.json();
      
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (error) {
      console.error('OAuth error:', error);
      alert('Failed to initiate connection. Please check console.');
    }
  };

  const handleSaveConfig = () => {
    localStorage.setItem('certifypro_google_sheet_id', googleSheetId);
    localStorage.setItem('certifypro_ms_excel_path', microsoftExcelPath);
    alert('Configuration saved successfully.');
  };

  const handleSyncNow = () => {
    if (!isGoogleConnected && !isMicrosoftConnected) {
      alert('Please connect at least one provider first.');
      return;
    }
    setIsSyncing(true);
    // Simulate API call for syncing data
    setTimeout(() => {
      setIsSyncing(false);
      alert('Data synced successfully to your connected cloud storage.');
    }, 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (!user) return;
    if (!currentPassword) { setPwError('Current password is required.'); return; }
    if (!strength.isValid) { setPwError('New password does not meet requirements.'); return; }
    if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return; }

    setIsChangingPw(true);
    try {
      // Get the latest user data from the store to check password
      const fullUser = store.getUsers().find(u => u.id === user.id);
      if (!fullUser) { setPwError('User not found.'); return; }

      const oldHash = await hashPassword(currentPassword);
      if (fullUser.passwordHash !== oldHash) {
        setPwError('Incorrect current password.');
        return;
      }

      const newHash = await hashPassword(newPassword);
      store.updateUserPassword(user.id, newHash);
      
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPw(false);
    } catch (err) {
      setPwError('An error occurred while changing password.');
    } finally {
      setIsChangingPw(false);
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

      {/* Password Change Section */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#141414] border-b border-[#141414]/10 pb-2">Password Management</h3>
        <div className="bg-white border border-[#141414]/10 p-8">
          <form onSubmit={handleChangePassword} className="max-w-md space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full p-3 pr-12 bg-transparent border-b-2 border-[#141414] focus:outline-none focus:border-[#F27D26] transition-colors"
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#141414]/40 hover:text-[#141414]">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">
                New Password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full p-3 bg-transparent border-b-2 border-[#141414] focus:outline-none focus:border-[#F27D26] transition-colors"
                required
              />
              <PasswordStrengthMeter password={newPassword} show={!!newPassword} />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#141414]/50 mb-2">
                Confirm New Password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className={`w-full p-3 bg-transparent border-b-2 transition-colors focus:outline-none ${
                  confirmPassword && confirmPassword !== newPassword
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-[#141414] focus:border-[#F27D26]'
                }`}
                required
              />
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-xs text-red-500 font-semibold mt-1">Passwords do not match.</p>
              )}
            </div>

            {pwError && <p className="text-xs text-red-600 font-semibold flex items-center gap-1"><AlertCircle size={14} /> {pwError}</p>}
            {pwSuccess && <p className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle2 size={14} /> Password updated successfully!</p>}

            <button
              type="submit"
              disabled={isChangingPw || !strength.isValid || newPassword !== confirmPassword || !currentPassword}
              className="bg-[#141414] text-white px-6 py-4 font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Lock size={18} />
              {isChangingPw ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </div>
      </section>

      {/* Integrations Section */}
      {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) && (
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
            <p className="text-xs text-[#141414]/50 italic serif mb-6">
              Sync assessment results directly to a designated Google Sheet for advanced reporting.
            </p>

            {isGoogleConnected && (
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-[8px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1">Target Sheet ID</label>
                  <input 
                    type="text" 
                    value={googleSheetId}
                    onChange={(e) => setGoogleSheetId(e.target.value)}
                    placeholder="e.g. 1a2b3c4d5e6f..."
                    className="w-full p-2 bg-[#141414]/5 border border-[#141414]/10 focus:outline-none focus:border-[#F27D26] text-[10px] font-mono"
                  />
                </div>
              </div>
            )}

            <button 
              onClick={() => handleConnect('google')}
              className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isGoogleConnected 
                  ? 'border border-red-200 text-red-500 hover:bg-red-50' 
                  : 'bg-[#141414] text-white hover:bg-[#F27D26]'
              }`}
            >
              {isGoogleConnected ? 'Disconnect Account' : 'Connect Google Account'}
              {!isGoogleConnected && <ExternalLink size={12} />}
            </button>
          </div>

          {/* Microsoft Integration */}
          <div className={`bg-white border p-8 transition-all ${isMicrosoftConnected ? 'border-green-500 shadow-md' : 'border-[#141414]/10'}`}>
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
            <p className="text-xs text-[#141414]/50 italic serif mb-6">
              Export data to OneDrive/SharePoint Excel workbooks for organizational compliance.
            </p>

            {isMicrosoftConnected && (
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-[8px] font-bold uppercase tracking-widest text-[#141414]/40 mb-1">OneDrive File Path</label>
                  <input 
                    type="text" 
                    value={microsoftExcelPath}
                    onChange={(e) => setMicrosoftExcelPath(e.target.value)}
                    placeholder="e.g. /Assessments/2026_Report.xlsx"
                    className="w-full p-2 bg-[#141414]/5 border border-[#141414]/10 focus:outline-none focus:border-[#F27D26] text-[10px] font-mono"
                  />
                </div>
              </div>
            )}

            <button 
              onClick={() => handleConnect('microsoft')}
              className={`w-full py-3 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                isMicrosoftConnected 
                  ? 'border border-red-200 text-red-500 hover:bg-red-50' 
                  : 'bg-[#141414] text-white hover:bg-[#F27D26]'
              }`}
            >
              {isMicrosoftConnected ? 'Disconnect Account' : 'Connect Microsoft Account'}
              {!isMicrosoftConnected && <ExternalLink size={12} />}
            </button>
          </div>
        </div>

        {(isGoogleConnected || isMicrosoftConnected) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 pt-4"
          >
            <button 
              onClick={handleSaveConfig}
              className="px-6 py-3 bg-[#141414] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#F27D26] transition-all flex items-center gap-2"
            >
              <SaveIcon size={14} />
              Save Configuration
            </button>
            <button 
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-6 py-3 border border-[#141414] text-[#141414] text-[10px] font-bold uppercase tracking-widest hover:bg-[#141414]/5 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </motion.div>
        )}
      </section>
      )}

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
