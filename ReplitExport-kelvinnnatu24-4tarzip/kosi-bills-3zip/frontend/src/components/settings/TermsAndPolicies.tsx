import { motion } from 'motion/react';
import { ChevronLeft, Shield, FileText, Lock, Scale, CheckCircle2 } from 'lucide-react';

interface TermsAndPoliciesProps {
  onBack: () => void;
}

export default function TermsAndPolicies({ onBack }: TermsAndPoliciesProps) {
  const sections = [
    {
      title: "1. Introduction",
      icon: FileText,
      content: "Welcome to Kosi Bills. These Terms and Conditions govern your use of our platform. By accessing or using our services, you agree to be bound by these terms. Kosi Bills is a registered entity under the Corporate Affairs Commission (CAC) of Nigeria (RC: 123456789)."
    },
    {
      title: "2. Account Security",
      icon: Lock,
      content: "You are responsible for maintaining the confidentiality of your account credentials, including your transaction PIN and biometric data. Kosi Bills will never ask for your PIN via email or phone. Any transaction authorized with your PIN is deemed to have been authorized by you."
    },
    {
      title: "3. Transaction Policies",
      icon: CheckCircle2,
      content: "All transactions are final once processed. In 'Live Mode', real funds are deducted from your balance to fulfill service requests (Data, Airtime, Bills). We act as an intermediary between you and the service providers. While we strive for 100% uptime, service delivery depends on third-party network availability."
    },
    {
      title: "4. Privacy & Data Protection",
      icon: Shield,
      content: "We collect and process your personal data in accordance with the Nigeria Data Protection Regulation (NDPR). Your data is used solely for service delivery, security verification, and improving your user experience. We do not sell your personal information to third parties."
    },
    {
      title: "5. Compliance & CAC",
      icon: Scale,
      content: "Kosi Bills operates in full compliance with Nigerian financial regulations. Our CAC registration ensures that we are a legitimate business entity. We maintain strict Anti-Money Laundering (AML) and Know Your Customer (KYC) policies across all account tiers."
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all shadow-sm"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Terms & Policies</h2>
          <p className="text-slate-500 dark:text-slate-400">Last updated: March 2026</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-4"
            >
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">{section.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
                {section.content}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-emerald-600 rounded-[2.5rem] p-10 text-white text-center space-y-4 shadow-2xl shadow-emerald-600/20">
        <h3 className="text-2xl font-bold">Have questions?</h3>
        <p className="text-emerald-100 max-w-lg mx-auto">
          If you need clarification on any of our policies or have concerns about your account security, our support team is available 24/7.
        </p>
        <button className="px-8 py-4 bg-white text-emerald-700 rounded-2xl font-bold hover:bg-emerald-50 transition-all">
          Contact Support
        </button>
      </div>
    </div>
  );
}
