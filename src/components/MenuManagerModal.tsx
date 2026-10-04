import React, { useState } from 'react';
import { MenuItem } from '../types';
import { PRESET_OPTIONS, NAVY_YELLOW_PALETTE, DEFAULT_MENUS } from '../data/defaultMenus';
import { X, Plus, Trash2, RotateCcw, AlertCircle, Check } from 'lucide-react';

interface MenuManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: MenuItem[];
  onUpdateItems: (newItems: MenuItem[]) => void;
}

export const MenuManagerModal: React.FC<MenuManagerModalProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateItems,
}) => {
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🍕');
  const [newColorIdx, setNewColorIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleToggleEnabled = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, enabled: !item.enabled } : item
    );
    const enabledCount = updated.filter((i) => i.enabled).length;
    if (enabledCount < 2) {
      setErrorMsg('룰렛을 돌리려면 최소 2개 이상의 메뉴가 활성화되어야 해요!');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    onUpdateItems(updated);
  };

  const handleWeightChange = (id: string, weight: number) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, weight } : item
    );
    onUpdateItems(updated);
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (items.length <= 2) {
      setErrorMsg('룰렛 회전을 위해 최소 2개 이상의 메뉴가 필요합니다.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    const updated = items.filter((item) => item.id !== id);
    onUpdateItems(updated);
  };

  const handleResetToDefault = () => {
    onUpdateItems(DEFAULT_MENUS);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setErrorMsg('메뉴 이름을 입력해 주세요.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    if (items.some((i) => i.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('이미 등록된 메뉴 이름입니다.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const palette = NAVY_YELLOW_PALETTE[newColorIdx % NAVY_YELLOW_PALETTE.length];
    const newItem: MenuItem = {
      id: `custom_${Date.now()}`,
      name: trimmed,
      emoji: newEmoji || '🍽️',
      color: palette.bg,
      textColor: palette.text,
      description: `${trimmed} 먹고 활력 충전 완료!`,
      weight: 1,
      enabled: true,
      isDefault: false,
    };

    onUpdateItems([...items, newItem]);
    setNewName('');
    setNewEmoji('🍕');
    setErrorMsg('');
  };

  const handleQuickAdd = (preset: { name: string; emoji: string }) => {
    if (items.some((i) => i.name === preset.name)) {
      setErrorMsg(`'${preset.name}' 메뉴는 이미 목록에 있어요!`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    // Alternate navy and yellow based on current items length
    const palette = NAVY_YELLOW_PALETTE[items.length % NAVY_YELLOW_PALETTE.length];
    const newItem: MenuItem = {
      id: `custom_${Date.now()}_${preset.name}`,
      name: preset.name,
      emoji: preset.emoji,
      color: palette.bg,
      textColor: palette.text,
      description: `${preset.name} 먹으러 가요! 신나는 점심시간!`,
      weight: 1,
      enabled: true,
      isDefault: false,
    };
    onUpdateItems([...items, newItem]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] bg-[#0F172A] text-slate-100 rounded-3xl p-6 shadow-2xl border-2 border-amber-400/50 flex flex-col overflow-hidden"
        style={{
          boxShadow: '0 20px 40px -10px rgba(250, 204, 21, 0.2)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-amber-300 font-jua">
              메뉴 직접 추가 & 삭제
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              원하는 메뉴를 자유롭게 추가하고 쓰레기통 버튼으로 즉시 삭제하세요
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notification banner if any */}
        {errorMsg && (
          <div className="mt-3 py-2 px-3 bg-rose-950/60 border border-rose-500/50 rounded-xl flex items-center gap-2 text-rose-300 text-xs font-medium animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2.5 pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                item.enabled
                  ? 'bg-slate-900 border-slate-700/80 shadow-xs'
                  : 'bg-slate-900/40 border-slate-800 opacity-50'
              }`}
            >
              {/* Left: Checkbox + Emoji + Name */}
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  id={`check_${item.id}`}
                  checked={item.enabled}
                  onChange={() => handleToggleEnabled(item.id)}
                  className="w-4 h-4 text-amber-500 rounded-md border-slate-600 bg-slate-800 focus:ring-amber-400 cursor-pointer"
                />
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border border-white/20 shadow-inner"
                  style={{ backgroundColor: item.color }}
                >
                  {item.emoji}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-slate-100 truncate">
                      {item.name}
                    </span>
                    {item.isDefault && (
                      <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-medium border border-amber-400/20">
                        기본
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-[150px] sm:max-w-xs">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Right: Weight Selector & Delete */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Weight selector */}
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5 text-xs font-semibold text-slate-300">
                  {[1, 2, 3].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => handleWeightChange(item.id, w)}
                      disabled={!item.enabled}
                      className={`px-2 py-1 rounded-md text-[11px] transition-colors ${
                        item.weight === w
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                          : 'hover:text-white disabled:opacity-40'
                      }`}
                      title={`${w}배 가중치 (확률 증가)`}
                    >
                      {w}x
                    </button>
                  ))}
                </div>

                {/* Delete button (Direct delete for ANY menu, checks min 2) */}
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id, item.name)}
                  className="p-2 text-rose-400 hover:text-white hover:bg-rose-600/80 rounded-xl transition-colors border border-transparent hover:border-rose-500"
                  title={`${item.name} 메뉴 즉시 삭제`}
                  aria-label={`${item.name} 삭제`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Quick preset recommendations */}
          <div className="pt-2">
            <span className="text-xs font-semibold text-slate-400 block mb-2">
              추천 메뉴 원클릭 추가
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_OPTIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleQuickAdd(preset)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.name}</span>
                  <Plus className="w-3 h-3 text-amber-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Add custom menu form */}
          <form
            onSubmit={handleAddNew}
            className="mt-4 p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800"
          >
            <span className="text-xs font-bold text-amber-300 block mb-2.5">
              새로운 메뉴 직접 등록하기
            </span>
            <div className="flex items-center gap-2 mb-2.5">
              <input
                type="text"
                value={newEmoji}
                onChange={(e) => setNewEmoji(e.target.value)}
                className="w-12 text-center py-2 px-1 text-lg rounded-xl border border-slate-700 bg-slate-800 text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                maxLength={2}
                title="이모지"
              />
              <input
                type="text"
                placeholder="메뉴 이름 (예: 짬뽕, 찜닭)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 py-2 px-3 text-sm rounded-xl border border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
              />
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs hover:bg-amber-300 transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>추가</span>
              </button>
            </div>

            {/* Navy & Yellow color picker */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">색상:</span>
              {NAVY_YELLOW_PALETTE.map((pal, idx) => (
                <button
                  key={pal.name}
                  type="button"
                  onClick={() => setNewColorIdx(idx)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform ${
                    newColorIdx === idx ? 'border-amber-300 scale-125 shadow-md' : 'border-slate-700'
                  }`}
                  style={{ backgroundColor: pal.bg }}
                  title={pal.name}
                />
              ))}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="py-2 px-3 rounded-xl border border-slate-700 bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 5개 메뉴로 초기화</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <Check className="w-4 h-4" />
            <span>설정 완료</span>
          </button>
        </div>
      </div>
    </div>
  );
};
