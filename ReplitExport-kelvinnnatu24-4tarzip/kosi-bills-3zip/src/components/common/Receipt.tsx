import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Share2, CheckCircle2, Printer, MessageCircle, ArrowLeft } from 'lucide-react';
import { Receipt as ReceiptType } from '../../types';
import Logo from './Logo';
import { useRef, useState, useEffect } from 'react';
import * as htmlToImage from 'html-to-image';
import toast from 'react-hot-toast';

interface ReceiptProps {
  receipt: ReceiptType;
  onClose: () => void;
}

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-slate-500 dark:text-slate-400 text-sm whitespace-nowrap">{label}</span>
    <span className="font-semibold text-slate-900 dark:text-white text-sm text-right break-all">{value}</span>
  </div>
);

export default function Receipt({ receipt, onClose }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    // Hide celebration after 2.5 seconds
    const timer = setTimeout(() => setShowCelebration(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const generateImage = async () => {
    if (!receiptRef.current) return null;
    try {
      setIsGenerating(true);
      const dataUrl = await htmlToImage.toPng(receiptRef.current, {
        quality: 1.0,
        pixelRatio: 3, // Higher resolution for better quality
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
        }
      });
      return dataUrl;
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate receipt image');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareWhatsApp = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], 'kosi-receipt.png', { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Kosi Bills Receipt',
          text: `Just paid my ${receipt.type} bill using Kosi Bills! 🚀`,
          files: [file],
        });
      } else {
        // Fallback: Download the image and open WhatsApp
        const link = document.createElement('a');
        link.download = 'kosi-receipt.png';
        link.href = dataUrl;
        link.click();
        
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Just paid my ${receipt.type} bill using Kosi Bills! 🚀`)}`;
        window.open(whatsappUrl, '_blank');
        toast.success('Receipt downloaded. You can now share it on WhatsApp!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error('Could not share directly. Try downloading instead.');
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    
    const link = document.createElement('a');
    link.download = `kosi-receipt-${receipt.reference}.png`;
    link.href = dataUrl;
    link.click();
    toast.success('Receipt downloaded successfully!');
  };

  return (
    <>
      <AnimatePresence>
        {showCelebration && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-emerald-500/95 backdrop-blur-md"
          >
            <motion.div
              animate={{ 
                y: [0, -30, 0, -15, 0],
                rotate: [0, -10, 10, -5, 5, 0],
                scale: [1, 1.15, 1, 1.05, 1]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl mb-8"
            >
              <Logo className="w-20 h-20 text-emerald-500" />
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black text-white tracking-tight text-center px-4"
            >
              Payment Successful!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-emerald-100 mt-3 font-medium text-lg"
            >
              Generating your receipt...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto transition-opacity duration-500 ${showCelebration ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={!showCelebration ? { scale: 1, opacity: 1, y: 0 } : {}}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="w-full max-w-md my-8 relative"
        >
          {/* Back Button - Floating outside the receipt */}
          <div className="absolute -top-14 left-0 right-0 flex justify-between items-center z-10">
            <button 
              onClick={onClose} 
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
            <button 
              onClick={onClose} 
              className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* The Receipt Card (This is what gets captured) */}
          <div 
            ref={receiptRef}
            className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden relative"
          >
            {/* Top Accent Line */}
            <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600"></div>
            
            {/* Decorative Background Elements */}
            <div className="absolute -right-24 -top-24 w-64 h-64 bg-emerald-50 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="absolute -left-24 top-1/3 w-48 h-48 bg-teal-50 dark:bg-teal-900/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>

            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] pointer-events-none z-0">
              <Logo className="w-64 h-64" />
            </div>

            <div className="p-8 relative z-10">
              {/* Header */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-50 dark:ring-emerald-900/30">
                  <Logo className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Transaction Receipt</h2>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1.5">{receipt.date}</p>
              </div>

              {/* Amount Section */}
              <div className="text-center mb-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl py-6 px-4 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-full blur-2xl"></div>
                <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-teal-100/50 dark:bg-teal-900/20 rounded-full blur-2xl"></div>
                
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 relative z-10">Total Amount</p>
                <div className="flex items-center justify-center relative z-10">
                  <span className="text-3xl text-slate-400 dark:text-slate-500 font-light mr-1">₦</span>
                  <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {receipt.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1 bg-emerald-100/50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-semibold border border-emerald-200 dark:border-emerald-500/30 relative z-10">
                  <CheckCircle2 className="w-4 h-4" />
                  {receipt.status}
                </div>
              </div>

              {/* Dashed Divider with Cutouts */}
              <div className="relative flex items-center justify-center py-2 mb-6">
                <div className="absolute w-full border-t-2 border-dashed border-slate-200 dark:border-slate-700"></div>
                <div className="absolute -left-11 w-6 h-6 bg-slate-900/60 rounded-full"></div>
                <div className="absolute -right-11 w-6 h-6 bg-slate-900/60 rounded-full"></div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-4 mb-8">
                <DetailRow label="Transaction Type" value={<span className="capitalize">{receipt.type}</span>} />
                <DetailRow label="Recipient" value={receipt.recipient} />
                <DetailRow label="Amount" value={`₦${receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <DetailRow label="Fee" value={`₦${receipt.fee.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} />
                <DetailRow label="Payment Method" value="Kosi Wallet" />
                <DetailRow label="Reference" value={<span className="font-mono text-xs text-slate-500 dark:text-slate-400">{receipt.reference}</span>} />
              </div>

              {/* Barcode Section */}
              <div className="flex flex-col items-center justify-center mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="w-full max-w-[240px] h-12 opacity-40 dark:opacity-60 flex justify-between items-center gap-0.5">
                  {/* Generate random-looking barcode lines */}
                  {[...Array(45)].map((_, i) => (
                    <div 
                      key={i} 
                      className="bg-slate-800 dark:bg-slate-200 h-full rounded-sm" 
                      style={{ 
                        width: `${Math.random() > 0.5 ? 2 : Math.random() > 0.8 ? 4 : 1}px`,
                        opacity: Math.random() > 0.2 ? 1 : 0
                      }}
                    ></div>
                  ))}
                </div>
                <p className="text-[10px] font-mono text-slate-400 tracking-[0.2em] mt-2">{receipt.reference}</p>
              </div>

              {/* Footer / Branding */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
                <div className="flex items-center gap-2 opacity-40 grayscale">
                  <Logo className="w-5 h-5" />
                  <span className="text-sm font-bold tracking-widest uppercase">Kosi Bills</span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center max-w-[250px]">
                  This is a computer generated receipt and does not require a physical signature. Thank you for choosing Kosi Bills.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons (Outside the captured area) */}
          <div className="mt-6 flex flex-col gap-3">
            <button 
              onClick={handleShareWhatsApp}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 py-4 px-4 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-2xl font-bold shadow-lg shadow-[#25D366]/20 transition-all active:scale-95 disabled:opacity-70"
            >
              <MessageCircle className="w-5 h-5" />
              {isGenerating ? 'Preparing Receipt...' : 'Share to WhatsApp'}
            </button>
            
            <div className="flex gap-3">
              <button 
                onClick={handleDownload}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 disabled:opacity-70"
              >
                <Download className="w-4 h-4" />
                Save Image
              </button>
              <button 
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl font-semibold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="w-full mt-2 py-3 text-slate-400 hover:text-white font-medium transition-colors"
            >
              Close Receipt
            </button>
          </div>
        </motion.div>
      </div>
    </>
  );
}


