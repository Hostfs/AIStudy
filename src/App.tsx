/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { MenuItem, SpinHistoryItem } from './types';
import { DEFAULT_MENUS, NAVY_YELLOW_PALETTE } from './data/defaultMenus';
import { soundManager } from './utils/audio';
import { RouletteWheel } from './components/RouletteWheel';
import { WinnerModal } from './components/WinnerModal';
import { MenuManagerModal } from './components/MenuManagerModal';
import { HistoryModal } from './components/HistoryModal';
import {
  Volume2,
  VolumeX,
  History,
  SlidersHorizontal,
  Sparkles,
  Zap,
  Clock,
  RotateCcw,
  UtensilsCrossed,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  // Load saved menus or defaults
  const [items, setItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('club_lunch_roulette_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_MENUS;
  });

  // History state
  const [history, setHistory] = useState<SpinHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('club_lunch_roulette_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Direct quick-add input state on main screen
  const [directInputName, setDirectInputName] = useState('');
  const [directInputEmoji, setDirectInputEmoji] = useState('🍜');
  const [inlineNotice, setInlineNotice] = useState('');

  // Roulette runtime states
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinTrigger, setSpinTrigger] = useState(0);
  const [winner, setWinner] = useState<MenuItem | null>(null);

  // Sound & Speed preferences
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());
  const [speedMode, setSpeedMode] = useState<'normal' | 'fast'>(() => {
    return (localStorage.getItem('club_lunch_speed_mode') as 'normal' | 'fast') || 'normal';
  });

  // Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Sync menus to localStorage
  const handleUpdateItems = (newItems: MenuItem[]) => {
    setItems(newItems);
    localStorage.setItem('club_lunch_roulette_items', JSON.stringify(newItems));
  };

  // Direct Add on Main Screen
  const handleDirectAddMenu = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = directInputName.trim();
    if (!trimmed) {
      setInlineNotice('메뉴 이름을 입력해주세요!');
      setTimeout(() => setInlineNotice(''), 2500);
      return;
    }
    if (items.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) {
      setInlineNotice(`'${trimmed}' 메뉴는 이미 목록에 있어요!`);
      setTimeout(() => setInlineNotice(''), 2500);
      return;
    }

    // Pick alternating color from palette
    const pal = NAVY_YELLOW_PALETTE[items.length % NAVY_YELLOW_PALETTE.length];
    const newItem: MenuItem = {
      id: `custom_${Date.now()}_${trimmed}`,
      name: trimmed,
      emoji: directInputEmoji || '🍽️',
      color: pal.bg,
      textColor: pal.text,
      description: `${trimmed} 먹고 활력 충전 완료!`,
      weight: 1,
      enabled: true,
      isDefault: false,
    };

    handleUpdateItems([...items, newItem]);
    setDirectInputName('');
    setInlineNotice(`'${trimmed}' 메뉴가 추가되었습니다!`);
    setTimeout(() => setInlineNotice(''), 2000);
  };

  // Direct Delete on Main Screen
  const handleDirectDeleteMenu = (id: string, name: string) => {
    if (isSpinning) return;
    if (items.length <= 2) {
      setInlineNotice('룰렛 회전을 위해 최소 2개 이상의 메뉴가 필요합니다.');
      setTimeout(() => setInlineNotice(''), 3000);
      return;
    }

    const updated = items.filter((i) => i.id !== id);
    handleUpdateItems(updated);
    setInlineNotice(`'${name}' 메뉴를 삭제했습니다.`);
    setTimeout(() => setInlineNotice(''), 2000);
  };

  // Quick toggle include/exclude on a single menu
  const handleQuickToggleItem = (id: string) => {
    if (isSpinning) return;
    const enabledCount = items.filter((i) => i.enabled).length;
    const target = items.find((i) => i.id === id);
    if (!target) return;

    if (target.enabled && enabledCount <= 2) {
      setInlineNotice('룰렛을 돌리려면 최소 2개 이상의 메뉴가 켜져 있어야 해요!');
      setTimeout(() => setInlineNotice(''), 3000);
      return;
    }

    const updated = items.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i));
    handleUpdateItems(updated);
  };

  // Handle sound toggle
  const handleToggleSound = () => {
    const nextMuted = soundManager.toggleMuted();
    setIsMuted(nextMuted);
  };

  // Handle speed toggle
  const handleSetSpeed = (mode: 'normal' | 'fast') => {
    setSpeedMode(mode);
    localStorage.setItem('club_lunch_speed_mode', mode);
  };

  // Trigger spin
  const handleTriggerSpin = () => {
    if (isSpinning) return;
    const enabledCount = items.filter((i) => i.enabled).length;
    if (enabledCount < 2) {
      setInlineNotice('룰렛을 돌리려면 최소 2개 이상의 메뉴를 켜주세요!');
      setTimeout(() => setInlineNotice(''), 3000);
      return;
    }
    setWinner(null);
    setSpinTrigger((prev) => prev + 1);
  };

  // Callback when spin starts
  const handleSpinStart = () => {
    setIsSpinning(true);
    setWinner(null);
  };

  // Callback when spin completes
  const handleSpinEnd = (winItem: MenuItem) => {
    setIsSpinning(false);
    setWinner(winItem);

    // Add to history
    const newEntry: SpinHistoryItem = {
      id: `spin_${Date.now()}`,
      menuId: winItem.id,
      menuName: winItem.name,
      emoji: winItem.emoji,
      color: winItem.color,
      timestamp: Date.now(),
    };
    const updatedHistory = [newEntry, ...history.slice(0, 49)];
    setHistory(updatedHistory);
    localStorage.setItem('club_lunch_roulette_history', JSON.stringify(updatedHistory));
  };

  // Clear history
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('club_lunch_roulette_history');
  };

  // Reset to default 5 items
  const handleResetToDefault = () => {
    if (confirm('메뉴를 기본 5종(국밥, 돈까스, 마라탕, 학식, 편의점)으로 초기화할까요?')) {
      handleUpdateItems(DEFAULT_MENUS);
      setInlineNotice('기본 메뉴 5종으로 복원되었습니다.');
      setTimeout(() => setInlineNotice(''), 2500);
    }
  };

  const enabledItems = items.filter((i) => i.enabled);

  // Dynamic mascot dialogue
  const mascotSpeech = isSpinning
    ? '두구두구... 과연 오늘의 메뉴는 무엇이 될까?! ✨'
    : winner
    ? `오늘 점심은 '${winner.name}'(으)로 결정! 맛있게 먹자~ 😋`
    : '오늘 코마 동아리 점심 뭐 먹지? 아래 버튼을 눌러 돌려봐! 🍲';

  return (
    <div className="min-h-screen bg-[#FEFCE8] text-[#1E293B] flex flex-col relative overflow-x-hidden selection:bg-amber-300 selection:text-slate-900">
      {/* Decorative Warm Cream, Navy & Yellow Ambient Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-20 w-[450px] h-[450px] bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-28 w-[400px] h-[400px] bg-amber-300/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-[420px] h-[420px] bg-sky-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 right-10 w-96 h-96 bg-yellow-200/40 rounded-full blur-3xl" />
      </div>

      {/* Top Bar (Follows Top Bar Contract) */}
      <header className="relative z-10 w-full border-b border-amber-200/80 bg-white/85 backdrop-blur-md px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        {/* Zone 1: Brand title wordmark with COMA mascot avatar */}
        <div className="flex items-center gap-2.5">
          <img
            src="/coma.png"
            alt="COMA 코마 마스코트"
            className="w-9 h-9 object-cover rounded-xl border-2 border-amber-400 shadow-xs"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold font-jua text-[#1E3A8A] tracking-tight leading-tight">
              COMA 점심 룰렛
            </span>
            <span className="text-[10px] text-amber-700 font-semibold tracking-wider">
              코마 동아리 공식
            </span>
          </div>
        </div>

        {/* Zone 2: Informational / context items */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 font-medium">
          <span>코마 점심 고민 끝</span>
          <span aria-hidden="true" className="text-amber-300">·</span>
          <span>남색 & 노란색 테마</span>
          <span aria-hidden="true" className="text-amber-300">·</span>
          <span className="text-[#1E3A8A] font-bold">{enabledItems.length}개 후보 참여 중</span>
        </div>

        {/* Zone 3: Clean action controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Mute Toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              isMuted
                ? 'border-slate-300 bg-slate-100 text-slate-400 hover:text-slate-600'
                : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
            title={isMuted ? '소리 켜기' : '음소거'}
            aria-label="소리 설정"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* History Button */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="p-2 sm:px-3 rounded-xl border border-amber-200 bg-white hover:bg-amber-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            title="룰렛 기록 보기"
          >
            <History className="w-4 h-4 text-[#1E3A8A]" />
            <span className="hidden sm:inline">기록</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-400 text-slate-950 rounded-full font-bold">
                {history.length}
              </span>
            )}
          </button>

          {/* Menu Management Button */}
          <button
            onClick={() => setIsMenuModalOpen(true)}
            className="py-2 px-3 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-300" />
            <span>메뉴 관리</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-5 sm:py-8 max-w-4xl mx-auto w-full">
        {/* COMA Mascot Feature Card (Placed prominently above the wheel) */}
        <div className="w-full max-w-lg mb-4 bg-white/90 backdrop-blur-md rounded-3xl p-3.5 sm:p-4 border-2 border-amber-300/80 shadow-md flex items-center gap-3.5 sm:gap-4">
          {/* Authentic 코마.png image */}
          <div className="w-20 h-16 sm:w-24 sm:h-20 shrink-0 rounded-2xl overflow-hidden border border-amber-200 bg-[#FEFCE8] shadow-inner flex items-center justify-center">
            <img
              src="/coma.png"
              alt="COMA 코마 마스코트 캐릭터"
              className="w-full h-full object-cover transform hover:scale-105 transition-transform"
            />
          </div>

          {/* Mascot Speech Bubble & Title */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-extrabold text-[#1E3A8A] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                COMA 마스코트
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-300" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2">
              "{mascotSpeech}"
            </p>
          </div>
        </div>

        {/* Central Roulette Container (Navy & Yellow with Cream background) */}
        <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 border-2 border-amber-300 coma-card-glow flex flex-col items-center shadow-lg">
          {/* Wheel Component */}
          <RouletteWheel
            items={items}
            isSpinning={isSpinning}
            onSpinStart={handleSpinStart}
            onSpinEnd={handleSpinEnd}
            speedMode={speedMode}
            spinTrigger={spinTrigger}
          />

          {/* Big Vibrant Yellow Action Spin Button */}
          <div className="w-full mt-6 flex flex-col items-center">
            <button
              onClick={handleTriggerSpin}
              disabled={isSpinning || enabledItems.length < 2}
              className={`w-full max-w-sm py-4 px-8 rounded-2xl font-bold text-lg sm:text-xl font-jua text-slate-950 transition-all flex items-center justify-center gap-2 ${
                isSpinning
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 coma-btn-shadow hover:brightness-105 active:scale-98'
              }`}
            >
              {isSpinning ? (
                <>
                  <div className="w-5 h-5 border-3 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>돌아가는 중... 두구두구!</span>
                </>
              ) : (
                <>
                  <span>코마 룰렛 힘차게 돌리기! 🎲</span>
                </>
              )}
            </button>

            {/* Quick Speed Switch & Reset */}
            <div className="mt-3.5 flex items-center justify-between w-full max-w-sm px-1 text-xs">
              {/* Speed Mode Selector */}
              <div className="flex items-center gap-1 bg-[#FEFCE8] p-1 rounded-xl border border-amber-200">
                <button
                  type="button"
                  onClick={() => handleSetSpeed('normal')}
                  disabled={isSpinning}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                    speedMode === 'normal'
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock className="w-3 h-3 text-amber-300" />
                  <span>일반 (4초)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetSpeed('fast')}
                  disabled={isSpinning}
                  className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                    speedMode === 'fast'
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>빠름 (2초)</span>
                </button>
              </div>

              {/* Reset to Default 5 Button */}
              <button
                type="button"
                onClick={handleResetToDefault}
                disabled={isSpinning}
                className="text-slate-500 hover:text-[#1E3A8A] font-medium flex items-center gap-1 transition-colors"
                title="기본 5개 메뉴(국밥, 돈까스, 마라탕, 학식, 편의점)로 복원"
              >
                <RotateCcw className="w-3 h-3" />
                <span>기본 메뉴 초기화</span>
              </button>
            </div>
          </div>

          {/* Inline notification banner if any action occurred */}
          {inlineNotice && (
            <div className="w-full mt-4 py-2 px-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-center gap-2 text-amber-900 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{inlineNotice}</span>
            </div>
          )}

          {/* Quick Direct Add Menu Bar (Main Screen) */}
          <form
            onSubmit={handleDirectAddMenu}
            className="w-full mt-5 pt-4 border-t border-amber-100 flex items-center gap-2"
          >
            <input
              type="text"
              value={directInputEmoji}
              onChange={(e) => setDirectInputEmoji(e.target.value)}
              className="w-11 text-center py-2 px-1 text-base rounded-xl border border-amber-200 bg-amber-50/60 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              maxLength={2}
              title="이모지"
            />
            <input
              type="text"
              placeholder="메뉴 직접 추가 (예: 떡볶이, 햄버거, 쌀국수)"
              value={directInputName}
              onChange={(e) => setDirectInputName(e.target.value)}
              className="flex-1 py-2 px-3 text-xs sm:text-sm rounded-xl border border-amber-200 bg-amber-50/40 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="py-2 px-3.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold text-xs flex items-center gap-1 transition-colors shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>추가</span>
            </button>
          </form>

          {/* Quick Menu List with Direct Delete & Toggle */}
          <div className="w-full mt-4 pt-3 border-t border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#1E3A8A] flex items-center gap-1">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                <span>참여 메뉴 목록 (클릭 시 제외 / [✕] 삭제)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                총 {items.length}개 메뉴
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`inline-flex items-center rounded-xl text-xs font-semibold border transition-all ${
                    item.enabled
                      ? 'bg-white border-amber-300 text-slate-800 shadow-xs hover:border-amber-400'
                      : 'bg-slate-100 border-slate-200 text-slate-400 line-through opacity-60'
                  }`}
                  style={{
                    backgroundColor: item.enabled ? `${item.color}15` : undefined,
                  }}
                >
                  {/* Clickable body to toggle enable/disable */}
                  <button
                    type="button"
                    onClick={() => handleQuickToggleItem(item.id)}
                    disabled={isSpinning}
                    className="py-1.5 pl-2.5 pr-1.5 flex items-center gap-1.5 text-left hover:text-[#1E3A8A] transition-colors"
                    title={item.enabled ? `${item.name} 클릭 시 룰렛에서 임시 제외` : `${item.name} 클릭 시 룰렛에 포함`}
                  >
                    <span className="text-sm">{item.emoji}</span>
                    <span>{item.name}</span>
                    {item.weight > 1 && item.enabled && (
                      <span className="text-[10px] text-[#1E3A8A] font-bold bg-amber-100 px-1 rounded-sm border border-amber-200">
                        {item.weight}x
                      </span>
                    )}
                  </button>

                  {/* Direct Delete Button on Chip */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDirectDeleteMenu(item.id, item.name);
                    }}
                    disabled={isSpinning}
                    className="p-1.5 pr-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-r-xl transition-colors"
                    title={`${item.name} 메뉴 바로 삭제`}
                    aria-label={`${item.name} 삭제`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Friendly Advice Tip for Club Members */}
        <div className="mt-5 text-center text-xs text-slate-500 max-w-sm">
          💡 코마 부원들과 함께 룰렛을 돌리고, 결과를 카톡방에 공유해보세요!
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-4 text-center text-xs text-slate-500 border-t border-amber-200/60 bg-white/60">
        COMA(코마) 동아리 점심 룰렛 · 오늘 점심도 맛있고 즐거운 시간 되세요!
      </footer>

      {/* Winner Celebration Modal */}
      <WinnerModal
        winner={winner}
        onClose={() => setWinner(null)}
        onReSpin={handleTriggerSpin}
      />

      {/* Menu Manager Modal */}
      <MenuManagerModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        items={items}
        onUpdateItems={handleUpdateItems}
      />

      {/* History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
