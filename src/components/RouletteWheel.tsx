import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MenuItem } from '../types';
import { soundManager } from '../utils/audio';

interface RouletteWheelProps {
  items: MenuItem[];
  isSpinning: boolean;
  onSpinStart: () => void;
  onSpinEnd: (winner: MenuItem) => void;
  speedMode: 'normal' | 'fast';
  spinTrigger?: number;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({
  items,
  isSpinning,
  onSpinStart,
  onSpinEnd,
  speedMode,
  spinTrigger = 0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentRotationRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastSliceIndexRef = useRef<number>(-1);
  const [pointerTilt, setPointerTilt] = useState<number>(0);
  const comaImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = '/coma.png';
    img.onload = () => {
      comaImgRef.current = img;
      drawWheel(currentRotationRef.current);
    };
  }, []);

  // Compute slice angular intervals
  const enabledItems = items.filter((item) => item.enabled);
  const totalWeight = enabledItems.reduce((sum, item) => sum + item.weight, 0);

  const getSliceAngles = useCallback(() => {
    let accumulated = 0;
    return enabledItems.map((item) => {
      const sliceAngle = (item.weight / totalWeight) * (2 * Math.PI);
      const start = accumulated;
      const end = accumulated + sliceAngle;
      accumulated = end;
      return { item, start, end, mid: (start + end) / 2 };
    });
  }, [enabledItems, totalWeight]);

  // Draw the wheel onto the high-DPI canvas
  const drawWheel = useCallback(
    (rotation: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const size = canvas.clientWidth;
      if (canvas.width !== size * dpr || canvas.height !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      const center = size / 2;
      const outerRadius = center - 16;
      const innerRadius = 38;

      if (enabledItems.length === 0) {
        // Empty state
        ctx.beginPath();
        ctx.arc(center, center, outerRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#F3F4F6';
        ctx.fill();
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#9CA3AF';
        ctx.font = '600 16px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('선택된 메뉴가 없어요!', center, center);
        ctx.restore();
        return;
      }

      const slices = getSliceAngles();

      // Outer shadow & background decorative ring
      ctx.save();
      ctx.beginPath();
      ctx.arc(center, center, outerRadius + 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.15)';
      ctx.fill();

      // Outer rim
      ctx.beginPath();
      ctx.arc(center, center, outerRadius + 4, 0, Math.PI * 2);
      ctx.fillStyle = '#0F172A';
      ctx.fill();
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 5;
      ctx.stroke();
      ctx.restore();

      // Slices
      slices.forEach((slice) => {
        const { item, start, end, mid } = slice;

        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(rotation);

        // Draw sector
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, outerRadius, start, end);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();

        // Sector border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Subtle slice highlight arc near edge
        ctx.beginPath();
        ctx.arc(0, 0, outerRadius - 4, start, end);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Draw text and emoji
        ctx.save();
        ctx.rotate(mid);

        // Emoji near the perimeter
        ctx.font = `${Math.min(28, Math.max(20, outerRadius * 0.16))}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const emojiDistance = outerRadius * 0.74;
        ctx.fillText(item.emoji, emojiDistance, 0);

        // Text title
        const textDistance = outerRadius * 0.46;
        ctx.fillStyle = item.textColor || '#FFFFFF';
        const fontSize = Math.min(18, Math.max(14, outerRadius * 0.1));
        ctx.font = `700 ${fontSize}px "Jua", "Noto Sans KR", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Drop shadow / stroke for high contrast readability
        ctx.lineWidth = 3;
        ctx.strokeStyle = item.color.toLowerCase().includes('fa') || item.color.toLowerCase().includes('fe') || item.color.toLowerCase().includes('fd')
          ? 'rgba(255, 255, 255, 0.9)'
          : 'rgba(15, 23, 42, 0.8)';
        ctx.strokeText(item.name, textDistance, 0);
        ctx.fillText(item.name, textDistance, 0);

        // If weight > 1, show small indicator
        if (item.weight > 1) {
          ctx.font = '700 11px "Noto Sans KR", sans-serif';
          ctx.fillStyle = item.textColor;
          ctx.fillText(`(${item.weight}배)`, outerRadius * 0.28, 0);
        }

        ctx.restore();
        ctx.restore();
      });

      // Rim decorative candy dots (Navy & Yellow theme)
      const numDots = Math.max(16, enabledItems.length * 4);
      for (let i = 0; i < numDots; i++) {
        const dotAngle = (i / numDots) * Math.PI * 2;
        const dotX = center + (outerRadius + 1) * Math.cos(dotAngle);
        const dotY = center + (outerRadius + 1) * Math.sin(dotAngle);
        ctx.beginPath();
        ctx.arc(dotX, dotY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = i % 2 === 0 ? '#FACC15' : '#FFFFFF';
        ctx.fill();
      }

      // Center decorative hub
      ctx.save();
      // Drop shadow for hub
      ctx.beginPath();
      ctx.arc(center, center, innerRadius + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.fill();

      // Outer hub ring
      ctx.beginPath();
      ctx.arc(center, center, innerRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#0F172A';
      ctx.fill();
      ctx.strokeStyle = '#FACC15';
      ctx.lineWidth = 4;
      ctx.stroke();

      if (comaImgRef.current && comaImgRef.current.complete) {
        // Draw COMA mascot cropped inside the center circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center, innerRadius - 3, 0, Math.PI * 2);
        ctx.clip();
        // The characters in coma.png are in the lower-middle portion
        // Draw image centered and scaled nicely
        const imgSize = (innerRadius - 3) * 2;
        ctx.drawImage(
          comaImgRef.current,
          center - innerRadius + 3,
          center - innerRadius + 3,
          imgSize,
          imgSize
        );
        ctx.restore();
      } else {
        // Inner hub circle
        ctx.beginPath();
        ctx.arc(center, center, innerRadius - 8, 0, Math.PI * 2);
        ctx.fillStyle = '#1E293B';
        ctx.fill();

        // Center icon or label
        ctx.fillStyle = '#FACC15';
        ctx.font = '700 13px "Jua", "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('COMA', center, center - 6);
        ctx.fillText('픽!', center, center + 9);
      }

      ctx.restore();
      ctx.restore();
    },
    [enabledItems, getSliceAngles]
  );

  // Redraw whenever items or rotation changes
  useEffect(() => {
    drawWheel(currentRotationRef.current);
  }, [drawWheel]);

  // Handle resizing
  useEffect(() => {
    const handleResize = () => {
      drawWheel(currentRotationRef.current);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWheel]);

  // Determine which slice is currently under the top pointer
  const getSliceUnderPointer = useCallback(
    (rotation: number) => {
      if (enabledItems.length === 0) return null;
      const slices = getSliceAngles();
      // Pointer is at the top: angle = -PI/2
      const pointerAngle = -Math.PI / 2;
      // Local angle = pointerAngle - rotation
      let localAngle = (pointerAngle - rotation) % (2 * Math.PI);
      if (localAngle < 0) localAngle += 2 * Math.PI;

      for (let i = 0; i < slices.length; i++) {
        if (localAngle >= slices[i].start && localAngle < slices[i].end) {
          return { item: slices[i].item, index: i };
        }
      }
      return { item: slices[0].item, index: 0 };
    },
    [enabledItems.length, getSliceAngles]
  );

  // Trigger spin animation
  const startSpinAnimation = useCallback(() => {
    if (enabledItems.length === 0 || isSpinning) return;
    onSpinStart();
    soundManager.playSpinStart();

    // Select weighted random winner
    const slices = getSliceAngles();
    const randomWeight = Math.random() * totalWeight;
    let chosenSlice = slices[0];
    let weightSum = 0;

    for (const slice of slices) {
      weightSum += slice.item.weight;
      if (randomWeight <= weightSum) {
        chosenSlice = slice;
        break;
      }
    }

    // Winner target angle under pointer (top: -PI/2)
    // Slice mid angle with random jitter
    const sliceSpan = chosenSlice.end - chosenSlice.start;
    const jitter = (Math.random() - 0.5) * sliceSpan * 0.7; // stay safely inside slice
    const targetLocalAngle = chosenSlice.mid + jitter;

    // We want: (-PI/2 - finalRotation) % 2PI == targetLocalAngle
    // => finalRotation % 2PI == -PI/2 - targetLocalAngle
    const desiredTargetModulo = ((-Math.PI / 2 - targetLocalAngle) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    const startRot = currentRotationRef.current;
    const currentModulo = ((startRot % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Number of complete spins
    const minTurns = speedMode === 'fast' ? 4 : 7;
    const extraTurns = Math.floor(Math.random() * 2);
    let delta = desiredTargetModulo - currentModulo;
    if (delta < 0) {
      delta += 2 * Math.PI;
    }
    const totalRotationDistance = (minTurns + extraTurns) * 2 * Math.PI + delta;
    const finalRot = startRot + totalRotationDistance;

    const duration = speedMode === 'fast' ? 2200 : 4200;
    const startTime = performance.now();

    // Cubic-bezier ease-out curve
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
    const easeOutQuartic = (t: number): number => 1 - Math.pow(1 - t, 4);
    const ease = speedMode === 'fast' ? easeOutCubic : easeOutQuartic;

    let prevPointerSliceIndex = -1;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = ease(progress);

      const currentAngle = startRot + totalRotationDistance * easedProgress;
      currentRotationRef.current = currentAngle;
      drawWheel(currentAngle);

      // Check slice under pointer for audio tick & pointer bounce
      const under = getSliceUnderPointer(currentAngle);
      if (under && under.index !== prevPointerSliceIndex) {
        prevPointerSliceIndex = under.index;
        lastSliceIndexRef.current = under.index;
        // Pitch variation slightly as it decelerates
        const pitchMultiplier = 0.9 + Math.random() * 0.2;
        soundManager.playTick(pitchMultiplier);
        // Tilt pointer
        setPointerTilt(18);
        setTimeout(() => setPointerTilt(0), 60);
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        currentRotationRef.current = finalRot;
        drawWheel(finalRot);
        setPointerTilt(0);
        soundManager.playWinFanfare();
        onSpinEnd(chosenSlice.item);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [
    enabledItems.length,
    isSpinning,
    onSpinStart,
    getSliceAngles,
    totalWeight,
    speedMode,
    drawWheel,
    getSliceUnderPointer,
    onSpinEnd,
  ]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Respond to external spinTrigger changes
  const prevTriggerRef = useRef(spinTrigger);
  useEffect(() => {
    if (spinTrigger > 0 && spinTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = spinTrigger;
      startSpinAnimation();
    }
  }, [spinTrigger, startSpinAnimation]);

  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Pointer / Ticker at the top */}
      <div
        className="absolute -top-3 z-20 pointer-events-none transition-transform duration-75 ease-out"
        style={{
          transform: `translateX(-50%) rotate(${pointerTilt}deg)`,
          left: '50%',
          transformOrigin: 'top center',
        }}
      >
        <svg
          width="42"
          height="48"
          viewBox="0 0 42 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-lg"
        >
          {/* Outer pointer pin in Yellow with Navy stroke */}
          <path
            d="M21 46L6 14C3 8 7 2 14 2H28C35 2 39 8 36 14L21 46Z"
            fill="#FACC15"
            stroke="#0F172A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Inner navy hub mark */}
          <circle cx="21" cy="14" r="5" fill="#0F172A" />
          <circle cx="21" cy="14" r="2" fill="#FEF08A" />
        </svg>
      </div>

      {/* Interactive Wheel Canvas */}
      <div
        onClick={() => {
          if (!isSpinning && enabledItems.length > 0) {
            startSpinAnimation();
          }
        }}
        className={`relative cursor-pointer transition-transform duration-300 ${
          isSpinning ? 'scale-[0.99]' : 'hover:scale-[1.01] active:scale-95'
        }`}
        title={isSpinning ? '돌아가는 중...' : '클릭해서 룰렛 돌리기!'}
      >
        <canvas
          ref={canvasRef}
          className="w-[320px] h-[320px] sm:w-[390px] sm:h-[390px] md:w-[430px] md:h-[430px] rounded-full drop-shadow-2xl"
        />

        {/* Floating pulse ring when idle */}
        {!isSpinning && enabledItems.length > 0 && (
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/50 animate-ping pointer-events-none" />
        )}
      </div>

      {/* Manual Spin Trigger Exposed via Ref or Prop if needed */}
      <div className="mt-4 flex items-center gap-2">
        <span className="text-xs text-slate-400 font-medium">
          {enabledItems.length}개 메뉴 참여 중
        </span>
        <span className="text-slate-600">·</span>
        <span className="text-xs text-amber-400 font-medium">
          {isSpinning ? '두구두구 돌아가는 중...' : '룰렛이나 버튼을 누르면 시작돼요!'}
        </span>
      </div>
    </div>
  );
};
