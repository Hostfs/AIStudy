import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { MenuItem } from '../types';
import { Share2, RotateCcw, Check, Sparkles, X } from 'lucide-react';

interface WinnerModalProps {
  winner: MenuItem | null;
  onClose: () => void;
  onReSpin: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  onClose,
  onReSpin,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!winner) return;

    // Navy and Yellow celebratory confetti
    const navyYellowColors = ['#1E3A8A', '#FACC15', '#0F172A', '#F59E0B', '#FEF08A', '#FFFFFF', '#3B82F6'];

    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.6 },
      colors: navyYellowColors,
      disableForReducedMotion: true,
    });

    const timer = setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: navyYellowColors,
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: navyYellowColors,
      });
    }, 250);

    return () => clearTimeout(timer);
  }, [winner]);

  if (!winner) return null;

  const handleCopyShare = async () => {
    const text = `[COMA 코마 동아리 점심 룰렛 결과] 🍽️\n오늘의 점심 메뉴는 【${winner.emoji} ${winner.name}】으로 결정되었습니다!\n"${winner.description}"\n코마 부원들 다 같이 점심 맛있게 먹어요~ 🏃💨`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-sm bg-[#0F172A] rounded-3xl p-6 shadow-2xl border-2 border-amber-400 flex flex-col items-center text-center transform transition-all animate-in zoom-in-95 duration-200 text-white"
        style={{
          boxShadow: '0 20px 40px -10px rgba(250, 204, 21, 0.25)',
        }}
      >
        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* COMA Mascot header tag */}
        <div className="flex items-center gap-2 mb-2 px-3 py-1 bg-amber-400/10 border border-amber-400/40 rounded-full">
          <img
            src="/coma.png"
            alt="COMA"
            className="w-5 h-5 object-cover rounded-full"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <span className="text-xs font-bold text-amber-300">COMA 코마 동아리 픽!</span>
        </div>

        {/* Big Food Emoji with cute circular badge */}
        <div
          className="w-28 h-28 rounded-full flex items-center justify-center text-6xl shadow-inner border-4 border-amber-400 mb-3"
          style={{ backgroundColor: winner.color }}
        >
          <span className="transform hover:scale-110 transition-transform duration-200 select-none">
            {winner.emoji}
          </span>
        </div>

        {/* Menu Title */}
        <h2 className="text-2xl font-bold text-amber-300 font-jua mb-1.5 tracking-tight">
          {winner.name}
        </h2>

        {/* Fun Commentary / Description */}
        <p className="text-sm text-slate-300 leading-relaxed px-3 py-2 bg-slate-800/80 rounded-xl mb-5 w-full font-medium border border-slate-700">
          {winner.description || '모두가 만족하는 최고의 선택! 맛있게 드세요.'}
        </p>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2">
          {/* Copy to Kakao/Clipboard */}
          <button
            onClick={handleCopyShare}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              copied
                ? 'bg-emerald-500 text-white shadow-md'
                : 'bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-[0.98] shadow-md'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>클립보드에 복사 완료! 카톡에 붙여넣으세요</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-slate-950" />
                <span>결과 카톡으로 공유하기 (복사)</span>
              </>
            )}
          </button>

          {/* Secondary Action Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => {
                onClose();
                onReSpin();
              }}
              className="py-2.5 px-3 rounded-2xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>한 번 더 돌리기</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-3 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
            >
              <span>메뉴 확정!</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
