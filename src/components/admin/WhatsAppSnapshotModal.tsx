import React, { useState, useRef } from 'react';
import { Share2, Copy, Check, X, Camera, Users, DollarSign, CreditCard, ArrowUpRight, Download, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toPng, toBlob } from 'html-to-image';
import { GroupStats, User, Payment, Loan } from '../../types';

interface WhatsAppSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupStats: GroupStats;
  members: User[];
  payments: Payment[];
  loans: Loan[];
  totalDonations: number;
  complianceRate: number;
  adminName: string;
}

export default function WhatsAppSnapshotModal({
  isOpen,
  onClose,
  groupStats,
  members,
  payments,
  loans,
  totalDonations,
  complianceRate,
  adminName
}: WhatsAppSnapshotModalProps) {
  const [copied, setCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);
  const [isExporting, setIsExporting] = useState<'download' | 'copy' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const currentMonth = new Date().toLocaleString('default', { month: 'long' });
  const currentYear = new Date().getFullYear();

  if (!isOpen) return null;

  // Only active members (exclude inactive/exited members)
  const activeMembersList = members.filter(m => m.role === 'member' && m.status !== 'inactive');

  // Payments for current month for active members only
  const currentMonthPayments = payments.filter(
    p => p.month === currentMonth && 
         p.year === currentYear && 
         activeMembersList.some(m => m.id === p.memberId)
  );

  const paidCount = currentMonthPayments.filter(p => p.paid).length;
  const actualComplianceRate = activeMembersList.length > 0 
    ? (paidCount / activeMembersList.length) * 100 
    : 100;
  
  // Outstanding loans
  const activeLoans = loans.filter(l => l.status === 'active');
  const totalLoanAmount = groupStats.totalLoanAmount || 0;

  const handleCopyText = () => {
    const text = `📊 *F.O.R.T LEDGER OFFICIAL STATUS*
🗓 *Cycle:* ${currentMonth} ${currentYear}
────────────────────────
💰 *Total Available Funds:* LKR ${groupStats.totalFunds.toLocaleString()}
📥 *This Month's Collection:* LKR ${groupStats.monthlyCollection.toLocaleString()} (${Math.round(actualComplianceRate)}% Paid - ${paidCount}/${activeMembersList.length})
💳 *Active Loans Out:* LKR ${totalLoanAmount.toLocaleString()} (${activeLoans.length} Active ${activeLoans.length === 1 ? 'Loan' : 'Loans'})
────────────────────────
👥 *Payment Status:*
${activeMembersList.map(m => {
  const isPaid = currentMonthPayments.some(p => p.memberId === m.id && p.paid);
  return `${isPaid ? '✅' : '⏳'} ${m.name}: ${isPaid ? 'Settled' : 'Pending'}`;
}).join('\n')}
────────────────────────
Verified by Admin: ${adminName}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getExportOptions = () => ({
    pixelRatio: 2.5,
    cacheBust: true,
    skipFonts: true,
    backgroundColor: '#FAF9F6',
    style: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    } as any
  });

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting('download');
      const dataUrl = await toPng(cardRef.current, getExportOptions());
      const link = document.createElement('a');
      link.download = `FORT-Status-${currentMonth}-${currentYear}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsExporting(null);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsExporting('copy');
      const blob = await toBlob(cardRef.current, getExportOptions());
      if (blob) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setImageCopied(true);
        setTimeout(() => setImageCopied(false), 2500);
      }
    } catch (err) {
      console.warn('Direct clipboard image write failed, falling back to download:', err);
      // Fallback to downloading image if clipboard item API is blocked by browser/permission
      await handleDownloadImage();
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="w-full max-w-lg bg-white border-2 sm:border-3 border-black shadow-[6px_6px_0px_#000] sm:shadow-[10px_10px_0px_#000] rounded-none my-auto">
        {/* Modal Top Control Bar */}
        <div className="bg-[#FFE600] border-b-2 sm:border-b-3 border-black p-3 sm:p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black text-[#FFE600] flex items-center justify-center font-black text-xs border border-black shadow-[2px_2px_0px_#000]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-xs sm:text-sm tracking-wider uppercase text-black leading-tight">
                WhatsApp Snapshot Card
              </h3>
              <p className="text-[10px] font-mono font-bold text-black/70">Optimized for Mobile Screenshot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center text-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── THE SCREENSHOT FRAME (100% Self-Contained) ─── */}
        <div
          ref={cardRef}
          id="whatsapp-screenshot-node"
          className="p-4 sm:p-6 bg-[#FAF9F6] text-black font-sans antialiased"
          style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" }}
        >
          {/* Snapshot Header */}
          <div className="bg-black text-white p-3 sm:p-4 border-2 border-black mb-3 sm:mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 bg-[#FFE600] text-black font-black flex items-center justify-center text-sm border border-white shrink-0">
                FT
              </div>
              <div className="flex flex-col justify-center min-w-0">
                <h4 className="font-black text-xs sm:text-sm tracking-wider uppercase text-white whitespace-nowrap leading-none mb-1">
                  F.O.R.T LEDGER
                </h4>
                <p className="text-[9px] font-mono text-[#FFE600] tracking-wider font-bold whitespace-nowrap leading-none">
                  OFFICIAL STATUS REPORT
                </p>
              </div>
            </div>
            <div className="bg-[#FFE600] text-black px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border border-white whitespace-nowrap shrink-0 self-center">
              {currentMonth.toUpperCase()} {currentYear}
            </div>
          </div>

          {/* Hero Vault Box */}
          <div className="bg-[#FFE600] border-2 border-black p-4 mb-3 sm:mb-4 shadow-[3px_3px_0px_#000]">
            <div className="flex justify-between items-start mb-1 gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-black underline underline-offset-4 decoration-2 whitespace-nowrap">
                TOTAL AVAILABLE FUNDS
              </span>
              <span className="bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.5 border border-black flex items-center gap-1 shrink-0 whitespace-nowrap">
                <ArrowUpRight className="w-3 h-3 text-[#FFE600]" /> +LKR {groupStats.monthlyCollection.toLocaleString()}
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-sm sm:text-base font-black text-black/60 font-mono">LKR</span>
              <span className="text-3xl sm:text-4xl font-black text-black tracking-tight font-sans whitespace-nowrap">
                {groupStats.totalFunds.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Dual-Pillar Telemetry Grid: Inflow vs Outflow */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
            {/* Box 1: Collection / Inflow */}
            <div className="bg-white border-2 border-black p-3 sm:p-3.5 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between text-black/60 mb-1 gap-1">
                <span className="text-[9px] font-black tracking-wider uppercase whitespace-nowrap truncate">
                  This Month's Collection
                </span>
                <DollarSign className="w-3.5 h-3.5 text-black shrink-0" />
              </div>
              <p className="text-lg sm:text-xl font-black text-black tracking-tight whitespace-nowrap">
                LKR {groupStats.monthlyCollection.toLocaleString()}
              </p>
              <span className="text-[10px] font-mono font-bold text-emerald-600 block mt-0.5 whitespace-nowrap">
                {Math.round(actualComplianceRate)}% Paid ({paidCount}/{activeMembersList.length})
              </span>
            </div>

            {/* Box 2: Active Loans / Capital Out */}
            <div className="bg-white border-2 border-black p-3 sm:p-3.5 shadow-[2px_2px_0px_#000]">
              <div className="flex items-center justify-between text-black/60 mb-1 gap-1">
                <span className="text-[9px] font-black tracking-wider uppercase whitespace-nowrap truncate">
                  Active Loans
                </span>
                <CreditCard className="w-3.5 h-3.5 text-black shrink-0" />
              </div>
              <p className="text-lg sm:text-xl font-black text-black tracking-tight whitespace-nowrap">
                LKR {totalLoanAmount.toLocaleString()}
              </p>
              <span className="text-[10px] font-mono font-bold text-black/70 block mt-0.5 whitespace-nowrap">
                {activeLoans.length} Active {activeLoans.length === 1 ? 'Loan' : 'Loans'} Out
              </span>
            </div>
          </div>

          {/* Member Roll Call Mini Pills */}
          <div className="bg-white border-2 border-black p-3 mb-3 sm:mb-4 shadow-[2px_2px_0px_#000]">
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-[10px] font-black tracking-wider uppercase text-black whitespace-nowrap">
                PAYMENT STATUS ({paidCount}/{activeMembersList.length})
              </span>
              <span className="text-[9px] font-mono font-bold bg-[#FFE600] px-1.5 py-0.5 border border-black shrink-0 whitespace-nowrap">
                {paidCount === activeMembersList.length ? 'ALL SETTLED' : `${activeMembersList.length - paidCount} PENDING`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {activeMembersList.map(member => {
                const isPaid = currentMonthPayments.some(p => p.memberId === member.id && p.paid);
                return (
                  <div
                    key={member.id}
                    className={`px-2 py-1 border text-[10px] font-bold flex items-center justify-between gap-1 ${
                      isPaid
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900'
                        : 'bg-amber-50 border-amber-500 text-amber-900'
                    }`}
                  >
                    <span className="truncate whitespace-nowrap">{member.name}</span>
                    <span className="text-[9px] font-bold shrink-0">{isPaid ? '✓' : '•'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Seal */}
          <div className="flex items-center justify-between text-[10px] font-mono font-bold text-black/60 pt-2 border-t-2 border-dashed border-black/30">
            <span>Admin: {adminName}</span>
            <span>Secured Protocol v2.4</span>
          </div>
        </div>

        {/* Action Controls for Admin */}
        <div className="p-3 sm:p-4 bg-white border-t-2 sm:border-t-3 border-black space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleDownloadImage}
              disabled={isExporting !== null}
              className="brutal-btn py-2.5 px-3 bg-[#FFE600] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#FFF275] disabled:opacity-50"
            >
              {isExporting === 'download' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting HD PNG...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download PNG
                </>
              )}
            </button>

            <button
              onClick={handleCopyImage}
              disabled={isExporting !== null}
              className="brutal-btn py-2.5 px-3 bg-white text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all disabled:opacity-50"
            >
              {isExporting === 'copy' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Copying Image...
                </>
              ) : imageCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Image Copied!
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  Copy Image
                </>
              )}
            </button>
          </div>

          <button
            onClick={handleCopyText}
            className="w-full brutal-btn py-2 px-3 bg-gray-100 text-black font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-200"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                Copied WhatsApp Text Message!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy WhatsApp Text Summary
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
