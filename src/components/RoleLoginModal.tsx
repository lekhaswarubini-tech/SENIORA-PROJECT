import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, X } from 'lucide-react';
import { safeReadResponseJson } from '../services/safeJson';
import type { DemoAccountInfo, Role, SharedPlatformState } from '../types';

interface RoleLoginModalProps {
  open: boolean;
  onClose: () => void;
  currentRole: Role;
  onAuthenticated: (payload: {
    token: string;
    user: { id: string; role: Role; name: string; email: string; label: string };
    state: SharedPlatformState;
  }) => void;
}

export const RoleLoginModal: React.FC<RoleLoginModalProps> = ({
  open,
  onClose,
  currentRole,
  onAuthenticated,
}) => {
  const [accounts, setAccounts] = useState<DemoAccountInfo[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    fetch('/api/auth/demo-accounts')
      .then((r) => safeReadResponseJson<{ accounts?: DemoAccountInfo[] }>(r, {}))
      .then((parsed) => setAccounts(parsed.data.accounts || []))
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const submitLogin = async (loginEmail: string, loginPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const parsed = await safeReadResponseJson<{
        token?: string;
        user?: { id: string; role: Role; name: string; email: string; label: string };
        state?: SharedPlatformState;
        error?: string;
      } | null>(res, null);
      const data = parsed.data;
      if (!res.ok || !data || !data.token || !data.user || !data.state) {
        throw new Error(data?.error || 'Authentication failed. Please try again.');
      }
      onAuthenticated({ token: data.token, user: data.user, state: data.state });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#382C27]/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-[#FFFDF9] rounded-3xl border border-[#E8D5B5] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-5 border-b border-[#E8D5B5] bg-gradient-to-r from-[#FAF3E8] to-[#F3E7D2] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-[#355C48]" />
            <div>
              <h2 className="text-xl font-bold text-[#382C27]">
                Role-Based Sign In &amp; Demo Accounts
              </h2>
              <p className="text-sm text-[#63534B]">
                All 8 roles connect securely to the same underlying patient record with strict role-based permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#E8D5B5] text-[#63534B]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Select Demo Role Cards */}
          <div>
            <h3 className="text-sm font-bold text-[#382C27] mb-3">
              Select a Demo Account (Instant Sign In or Prefill Credentials)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accounts.map((acc) => {
                const isCurrent = acc.role === currentRole;
                return (
                  <div
                    key={acc.id}
                    className={`p-4 rounded-2xl border transition-colors ${
                      isCurrent
                        ? 'border-2 border-[#783F45] bg-[#F7ECEE]'
                        : 'border-[#E8D5B5] bg-[#FAF3E8]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-[#382C27]">{acc.label}</div>
                        <div className="text-xs text-[#63534B] font-mono-num mt-0.5">
                          {acc.email} · pw: {acc.demoPasswordHint}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => submitLogin(acc.email, acc.demoPasswordHint)}
                        className="px-3.5 py-2 rounded-xl bg-[#C46A4A] hover:bg-[#AE583A] text-white text-xs font-semibold shrink-0"
                      >
                        Enter Role
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Credential Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submitLogin(email, password);
            }}
            className="p-5 rounded-2xl border border-[#E8D5B5] bg-[#F3E7D2] space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-[#382C27]">
              <Lock className="w-4 h-4 text-[#9E4B30]" />
              <span>Sign In with Email &amp; Password</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (e.g., arjun.doctor@seniora.demo)"
                className="px-4 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-sm text-[#382C27]"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="px-4 py-3 rounded-xl border border-[#D9C098] bg-[#FFFDF9] text-sm text-[#382C27]"
              />
            </div>
            {error && (
              <div className="p-2.5 rounded-xl bg-[#F7ECEE] border border-[#783F45] text-sm text-[#382C27] font-semibold">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="px-5 py-2.5 rounded-xl bg-[#355C48] hover:bg-[#294838] disabled:opacity-50 text-white text-sm font-semibold"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
