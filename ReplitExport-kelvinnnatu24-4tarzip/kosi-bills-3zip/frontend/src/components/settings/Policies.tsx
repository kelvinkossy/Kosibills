import React from 'react';
import { motion } from 'motion/react';
import { Shield, AlertCircle, CheckCircle2, Info, Lock, Smartphone, Wallet, UserCheck } from 'lucide-react';

export default function Policies() {
  const policies = [
    {
      title: "Transaction Security",
      icon: Lock,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      content: "All transactions are protected by bank-grade encryption. We use multi-factor authentication (MFA) and transaction PINs to ensure your funds are safe. Never share your PIN or OTP with anyone, including Kosi Bills staff."
    },
    {
      title: "Account Verification (KYC)",
      icon: UserCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      content: "To comply with CBN regulations, users must complete KYC verification. Tier 1 allows up to ₦50,000 daily limit, while Tier 3 (BVN verified) allows up to ₦5,000,000. This helps prevent fraud and money laundering."
    },
    {
      title: "Refund Policy",
      icon: RefreshCw,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      content: "Failed transactions are automatically reversed within 24 hours. For utility bills, if the token is not generated but funds are debited, please contact support with your transaction ID for manual resolution."
    },
    {
      title: "Anti-Fraud Policy",
      icon: Shield,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
      content: "We monitor accounts for suspicious activity. Accounts involved in fraudulent transactions or unauthorized access attempts will be suspended immediately. We cooperate fully with law enforcement agencies (EFCC, Police)."
    },
    {
      title: "Privacy Policy",
      icon: Info,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      content: "Your data is handled according to NDPR guidelines. We do not sell your personal information to third parties. We only collect data necessary to provide our services and improve your experience."
    }
  ];

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black tracking-tight mb-2">Policies & Safety</h2>
          <p className="text-indigo-100 font-medium">How we protect you and your money</p>
        </div>
      </div>

      <div className="grid gap-4">
        {policies.map((policy, index) => (
          <motion.div
            key={policy.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl ${policy.bg} flex items-center justify-center ${policy.color} shrink-0`}>
                <policy.icon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{policy.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {policy.content}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6 flex items-start gap-4">
        <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-amber-800 dark:text-amber-400">Important Notice</h4>
          <p className="text-sm text-amber-700/80 dark:text-amber-500/80 mt-1">
            Kosi Bills will never ask for your password, PIN, or OTP via phone call, SMS, or email. Be wary of phishing attempts.
          </p>
        </div>
      </div>
    </div>
  );
}

import { RefreshCw } from 'lucide-react';
