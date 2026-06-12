'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prize } from '@/types';
import { DEFAULT_WHEEL_COLORS, normalizeWheelColors } from '@/lib/wheelColors';

interface SpinWheelProps {
  prizes: Prize[];
  onSpinStart: () => void;
  onSpinComplete: (prize: Prize) => void;
  isSpinning: boolean;
  colors?: string[];
}

const SpinWheel: React.FC<SpinWheelProps> = ({ prizes, onSpinStart, onSpinComplete, isSpinning, colors = DEFAULT_WHEEL_COLORS }) => {
  const [rotation, setRotation] = useState(0);
  const [blink, setBlink] = useState(false);
  const [spinFinished, setSpinFinished] = useState(false);
  const [winningPrize, setWinningPrize] = useState<Prize | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [pointerKick, setPointerKick] = useState(0);
  const [prizeImages, setPrizeImages] = useState<Record<string, HTMLImageElement>>({});
  const wheelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const spinSoundTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinSoundStartedAtRef = useRef(0);
  const lastPointerSegmentRef = useRef(0);

  const SEGMENT_COUNT = prizes.length;
  const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
  const SPIN_DURATION = 5;
  const wheelColors = normalizeWheelColors(colors);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  };

  const playTone = (frequency: number, duration: number, volume: number) => {
    const audioContext = getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gain.gain.setValueAtTime(volume, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  };

  const startSpinSound = () => {
    if (spinSoundTimerRef.current) clearTimeout(spinSoundTimerRef.current);
    spinSoundStartedAtRef.current = performance.now();

    const tick = () => {
      const elapsed = (performance.now() - spinSoundStartedAtRef.current) / 1000;
      if (elapsed >= SPIN_DURATION) return;

      playTone(520 + Math.random() * 80, 0.045, 0.035);
      const progress = elapsed / SPIN_DURATION;
      const nextTickDelay = 45 + Math.pow(progress, 2.6) * 300;
      spinSoundTimerRef.current = setTimeout(tick, nextTickDelay);
    };

    tick();
  };

  const playFinishSound = () => {
    playTone(659, 0.22, 0.08);
    setTimeout(() => playTone(880, 0.32, 0.1), 140);
  };

  const drawContainedImage = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    cx: number,
    cy: number,
    maxWidth: number,
    maxHeight: number
  ) => {
    const scale = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    
    ctx.save();
    // Draw white background/border for the image
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    const padding = 6;
    ctx.beginPath();
    ctx.roundRect(cx - drawWidth / 2 - padding, cy - drawHeight / 2 - padding, drawWidth + padding * 2, drawHeight + padding * 2, 8);
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.beginPath();
    ctx.roundRect(cx - drawWidth / 2 - padding, cy - drawHeight / 2 - padding, drawWidth + padding * 2, drawHeight + padding * 2, 8);
    ctx.clip();
    
    ctx.drawImage(image, cx - drawWidth / 2, cy - drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  };

  // 跑马灯闪烁定时器 (Blinking effect timer)
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => {
      clearInterval(interval);
      if (spinSoundTimerRef.current) clearTimeout(spinSoundTimerRef.current);
      audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const images: Record<string, HTMLImageElement> = {};
    const imagePrizes = prizes.filter((prize) => prize.imageUrl);

    Promise.all(imagePrizes.map((prize) => new Promise<void>((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => {
        images[prize.id] = image;
        resolve();
      };
      image.onerror = () => resolve();
      image.src = prize.imageUrl!;
    }))).then(() => {
      if (!cancelled) setPrizeImages(images);
    });

    return () => {
      cancelled = true;
    };
  }, [prizes]);

  useEffect(() => {
    if (!canvasRef.current || prizes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const radius = canvas.width / 2;
    const centerX = radius;
    const centerY = radius;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create Metallic Gold Gradient for Rims and Lines
    const goldGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    goldGradient.addColorStop(0, '#BF953F');
    goldGradient.addColorStop(0.25, '#FCF6BA');
    goldGradient.addColorStop(0.5, '#B38728');
    goldGradient.addColorStop(0.75, '#FBF5B7');
    goldGradient.addColorStop(1, '#AA771C');

    // Draw wheel segments
    prizes.forEach((prize, index) => {
      const startAngle = (index * SEGMENT_ANGLE * Math.PI) / 180;
      const endAngle = ((index + 1) * SEGMENT_ANGLE * Math.PI) / 180;

      const segmentColor = wheelColors[index % wheelColors.length];

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segmentColor;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.82)';
      ctx.lineWidth = 3;
      ctx.stroke();

      const middleAngle = startAngle + (endAngle - startAngle) / 2;
      const prizeImage = prizeImages[prize.id];
      
      const halfAngle = (SEGMENT_ANGLE * Math.PI / 180) / 2;

      if (prizeImage) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius - 10, startAngle, endAngle);
        ctx.closePath();
        ctx.clip();

        // Translate to center and rotate so negative Y points OUTWARDS along the middle angle
        ctx.translate(centerX, centerY);
        ctx.rotate(middleAngle + Math.PI / 2);

        // Position image comfortably between the center button and the text
        const imageCenterY = -radius * 0.5; 
        const maxWidth = 2 * Math.abs(imageCenterY) * Math.tan(halfAngle) * 0.8;
        const maxHeight = radius * 0.4;

        drawContainedImage(
          ctx,
          prizeImage,
          0,
          imageCenterY,
          maxWidth,
          maxHeight
        );

        ctx.restore();
      }

      let text = prize.name;
      if (text.length > 20) text = text.substring(0, 18) + '...';
      
      // If there's an image, push text towards the outer rim to make room
      const textRadius = prizeImage ? radius * 0.82 : (SEGMENT_COUNT <= 4 ? radius * 0.75 : radius * 0.72);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(middleAngle + Math.PI / 2);
      
      ctx.font = `900 ${SEGMENT_COUNT <= 4 ? 18 : 14}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textWidth = ctx.measureText(text).width;
      
      ctx.fillStyle = 'rgba(30, 41, 59, 0.68)';
      ctx.beginPath();
      ctx.roundRect(-textWidth / 2 - 9, -textRadius - 15, textWidth + 18, 30, 9);
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 5;
      ctx.fillText(text, 0, -textRadius);
      ctx.restore();
    });

    // Draw Thick Golden Outer Rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 7, 0, 2 * Math.PI);
    ctx.strokeStyle = '#F8E7B0';
    ctx.lineWidth = 13;
    ctx.stroke();

    // Inner Rim Highlight
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 14, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw Glowing Pegs (Lightbulbs) on the rim
    prizes.forEach((prize, index) => {
      const angle = (index * SEGMENT_ANGLE * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(centerX + Math.cos(angle) * (radius - 7), centerY + Math.sin(angle) * (radius - 7), 4.5, 0, 2 * Math.PI);
      
      // 交替闪烁逻辑
      const isLit = index % 2 === (blink ? 0 : 1);
      
      ctx.fillStyle = isLit ? '#FFFDF5' : '#D8CFAF';
      ctx.shadowColor = isLit ? '#FFF1B8' : 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = isLit ? 10 : 1;
    ctx.fill();
      
      ctx.shadowBlur = 0; // Reset shadow for stroke
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 1;
    ctx.stroke();
    });

    // 绘制中心按钮的金属底座 (Rim for the center button)
    ctx.beginPath();
    ctx.arc(centerX, centerY, 55, 0, 2 * Math.PI);
    ctx.fillStyle = goldGradient;
    ctx.fill();
    
    // Center Inner shadow/depth
    ctx.beginPath();
    ctx.arc(centerX, centerY, 48, 0, 2 * Math.PI);
    ctx.fillStyle = '#1A1A1A';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0; // Reset
  }, [prizes, prizeImages, SEGMENT_ANGLE, blink, SEGMENT_COUNT, wheelColors]);

  const handleSpin = () => {
    if (isSpinning || prizes.length === 0) return;
    onSpinStart();
    startSpinSound();

    const spins = 5 + Math.random() * 5;
    const randomAngle = Math.random() * 360;
    const totalRotation = spins * 360 + randomAngle;

    setRotation((prev) => prev + totalRotation);
  };

  const handleWheelUpdate = (currentRotation: number) => {
    if (!isSpinning || SEGMENT_COUNT === 0 || !Number.isFinite(currentRotation)) return;

    const pointerAngle = (270 - (currentRotation % 360) + 360) % 360;
    const segmentIndex = Math.floor(pointerAngle / SEGMENT_ANGLE) % SEGMENT_COUNT;

    if (segmentIndex !== lastPointerSegmentRef.current) {
      lastPointerSegmentRef.current = segmentIndex;
      setActiveSegmentIndex(segmentIndex);
      setPointerKick((value) => value + 1);
    }
  };

  const handleAnimationComplete = () => {
    if (!isSpinning) return;

    const finalRotation = rotation % 360;
    // Canvas 0 degrees is at 3 o'clock. The pointer is visually at 12 o'clock (270 degrees).
    // Calculate which angle on the original unrotated wheel is currently at 270 degrees.
    const pointerAngle = (270 - finalRotation + 360) % 360;
    const segmentIndex = Math.floor(pointerAngle / SEGMENT_ANGLE) % SEGMENT_COUNT;
    const winner = prizes[segmentIndex];

    setWinningPrize(winner);
    setActiveSegmentIndex(segmentIndex);
    setSpinFinished(true);
    if (spinSoundTimerRef.current) clearTimeout(spinSoundTimerRef.current);
    playFinishSound();
  };

  const handleNext = () => {
    if (winningPrize) {
      onSpinComplete(winningPrize);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <div className="relative flex items-center justify-center mt-4">

        <motion.div
          ref={wheelRef}
          animate={{ rotate: rotation }}
          transition={{
            duration: SPIN_DURATION,
            ease: [0.12, 0.72, 0.18, 1],
          }}
          onUpdate={(latest) => handleWheelUpdate(Number(latest.rotate))}
          onAnimationComplete={handleAnimationComplete}
          className="relative drop-shadow-[0_16px_35px_rgba(15,23,42,0.35)]"
        >
          <canvas
            ref={canvasRef}
            width={400}
            height={400}
            className="rounded-full"
          />
        </motion.div>

        {/* 中心 SPIN 按钮 (Center SPIN Button) */}
        <motion.button
          onClick={spinFinished ? handleNext : handleSpin}
          disabled={isSpinning && !spinFinished}
          whileHover={!isSpinning ? { scale: 1.1 } : {}}
          whileTap={!isSpinning ? { scale: 0.95 } : {}}
          className={`absolute z-30 w-24 h-24 rounded-full font-black text-2xl tracking-wider shadow-[0_0_30px_rgba(255,215,0,0.8)] border-4 border-yellow-200 flex items-center justify-center transition-all ${
            isSpinning && !spinFinished
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-gray-600 shadow-none'
              : 'bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 text-black hover:shadow-[0_0_50px_rgba(255,215,0,1)] hover:from-white hover:via-yellow-300 hover:to-yellow-500 cursor-pointer'
          }`}
        >
          {spinFinished ? 'NEXT' : isSpinning ? '...' : 'SPIN'}
        </motion.button>

        {/* Picker Wheel-style pointer that reacts to every passing segment */}
        <motion.div
          key={pointerKick}
          initial={{ rotate: 0 }}
          animate={{ rotate: isSpinning ? [0, -22, 5, 0] : 0 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="absolute -top-9 z-40 flex origin-top flex-col items-center drop-shadow-[0_5px_9px_rgba(15,23,42,0.35)]"
        >
          <motion.div
            animate={{ backgroundColor: wheelColors[activeSegmentIndex % wheelColors.length] }}
            className="relative z-30 flex h-12 w-12 items-center justify-center rounded-full border-4 border-white shadow-lg"
          >
            <div className="h-3 w-3 rounded-full bg-white/90 shadow-inner" />
          </motion.div>
          <motion.div
            animate={{ borderTopColor: wheelColors[activeSegmentIndex % wheelColors.length] }}
            className="z-20 -mt-2 h-0 w-0 border-l-[17px] border-r-[17px] border-t-[42px] border-l-transparent border-r-transparent drop-shadow-md"
          />
        </motion.div>
      </div>

      <div className="text-center text-sm text-gray-600 mt-2 bg-black/40 backdrop-blur px-6 py-2 rounded-full border border-gray-700">
        <p className="text-gray-300">
          Total Prizes: <span className="font-bold text-yellow-500">{prizes.length}</span> | Available: <span className="font-bold text-yellow-500">{prizes.filter((p) => p.currentWinners < p.maxWinners).length}</span>
        </p>
      </div>

      {/* Winner Pop-out Modal */}
      <AnimatePresence>
        {spinFinished && winningPrize && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="bg-gradient-to-b from-yellow-100 to-white p-8 rounded-3xl shadow-[0_0_50px_rgba(255,215,0,0.5)] border-4 border-yellow-400 max-w-sm w-full text-center relative overflow-hidden"
            >
              <h2 className="text-4xl font-black text-red-600 mb-4 drop-shadow-sm">🎉 WINNER!</h2>
              <p className="text-gray-600 font-semibold mb-2">Congratulations, you have won</p>
              <div className="bg-transparent py-4 px-2 rounded-xl mb-8">
                {winningPrize.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={winningPrize.imageUrl}
                    alt={winningPrize.name}
                    className="mx-auto mb-4 h-56 w-full rounded-2xl border-4 border-white bg-white object-contain p-2 shadow-lg"
                  />
                )}
                <p className="text-2xl font-bold text-gray-900">{winningPrize.name}</p>
              </div>
              
              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-800 text-white font-black text-xl rounded-xl shadow-lg hover:shadow-red-500/50 transition-all"
              >
                CLAIM PRIZE ➔
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SpinWheel;
