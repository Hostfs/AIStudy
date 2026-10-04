import React from 'react';
import { SpinHistoryItem } from '../types';
import { X, Trash2, Calendar, Award } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SpinHistoryItem[];
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const date = new Date(ts);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // Find top picked menu
  const menuCounts: Record<string, { count: number; emoji: string; color: string }> = {};
  history.forEach((h) => {
    if (!menuCounts[h.menuName]) {
      menuCounts[h.menuName] = { count: 0, emoji: h.emoji, color: h.color };
    }
    menuCounts[h.menuName].count += 1;
  });

  const sortedMenus = Object.entries(menuCounts).sort(
    (a, b) => b[1].count - a[1].count
  );
  const topWinner = sortedMenus.length > 0 ? sortedMenus[0] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] bg-[#0F172A] text-slate-100 rounded-3xl p-6 shadow-2xl border-2 border-amber-400/50 flex flex-col overflow-hidden"
        style={{
          boxShadow: '0 20px 40px -10px rgba(250, 204, 21, 0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-amber-300 font-jua">
              점심 룰렛 기록
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mini stat banner if history exists */}
        {topWinner && (
          <div className="mt-3 p-3 bg-amber-400/10 border border-amber-400/30 rounded-2xl flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 border border-white/20 shadow-inner"
              style={{ backgroundColor: topWinner[1].color }}
            >
              {topWinner[1].emoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-xs text-amber-400 font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>동아리 최다 당첨 메뉴</span>
              </div>
              <p className="text-sm font-bold text-slate-100 truncate">
                {topWinner[0]} ({topWinner[1].count}회 당첨)
              </p>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2 pr-1">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-sm font-medium">아직 룰렛 기록이 없어요.</p>
              <p className="text-xs text-slate-500 mt-1">
                룰렛을 돌려 오늘의 점심을 정해보세요!
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border border-white/20 shadow-inner"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.emoji}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">
                      {item.menuName}
                    </h4>
                    <span className="text-[11px] text-slate-400">
                      {formatTime(item.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={onClearHistory}
              className="py-2 px-3 rounded-xl text-rose-400 hover:text-white hover:bg-rose-600/80 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>기록 전체 삭제</span>
            </button>
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 text-xs transition-colors"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
