'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prize } from '@/types';

interface SpinWheelProps {
  prizes: Prize[];
  onSpinStart: () => void;
  onSpinComplete: (prize: Prize) => void;
  isSpinning: boolean;
}

const SpinWheel: React.FC<SpinWheelProps> = ({ prizes, onSpinStart, onSpinComplete, isSpinning }) => {
  const [rotation, setRotation] = useState(0);
  const [blink, setBlink] = useState(false);
  const [spinFinished, setSpinFinished] = useState(false);
  const [winningPrize, setWinningPrize] = useState<Prize | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const SEGMENT_COUNT = prizes.length;
  const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

  // 跑马灯闪烁定时器 (Blinking effect timer)
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

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

    // Premium Alternating Colors (Classic Casino Red & Black)
    const colors = ['#7A0000', '#111111'];

    // Draw wheel segments
    prizes.forEach((prize, index) => {
      const startAngle = (index * SEGMENT_ANGLE * Math.PI) / 180;
      const endAngle = ((index + 1) * SEGMENT_ANGLE * Math.PI) / 180;

      let segmentColor = colors[index % colors.length];
      if (index === prizes.length - 1 && prizes.length % 2 !== 0) {
        segmentColor = '#3A003A'; // Deep purple fallback for odd lengths
      }

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = segmentColor;
      ctx.fill();
      ctx.strokeStyle = goldGradient;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + (endAngle - startAngle) / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 6;
      ctx.font = 'bold 16px sans-serif';
      
      let text = prize.name;
      if (text.length > 16) text = text.substring(0, 14) + '...';
      ctx.fillText(text, radius - 45, 0);
      ctx.restore();
    });

    // Draw Thick Golden Outer Rim
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 7, 0, 2 * Math.PI);
    ctx.strokeStyle = goldGradient;
    ctx.lineWidth = 14;
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
      
      ctx.fillStyle = isLit ? '#FFFFFF' : '#888888';
      ctx.shadowColor = isLit ? '#FFEA00' : 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = isLit ? 15 : 2;
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
  }, [prizes, SEGMENT_ANGLE, blink]);

  const handleSpin = () => {
    if (isSpinning || prizes.length === 0) return;
    onSpinStart();

    const spins = 5 + Math.random() * 5;
    const randomAngle = Math.random() * 360;
    const totalRotation = spins * 360 + randomAngle;

    setRotation((prev) => prev + totalRotation);
  };

  const handleAnimationComplete = () => {
    if (!isSpinning) return;

    const finalRotation = rotation % 360;
    const normalizedRotation = (360 - finalRotation + 360) % 360;
    const segmentIndex = Math.floor(normalizedRotation / SEGMENT_ANGLE) % SEGMENT_COUNT;
    const winner = prizes[segmentIndex];

    setWinningPrize(winner);
    setSpinFinished(true);
  };

  const handleNext = () => {
    if (winningPrize) {
      onSpinComplete(winningPrize);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      <div className="relative flex items-center justify-center mt-4">
        
        {/* 左上侧长箭头 (Top Left Long Arrow) */}
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="absolute -top-16 -left-16 z-10 flex flex-col items-center opacity-90 -rotate-45"
        >
          <div className="w-2 h-32 bg-gradient-to-b from-transparent via-yellow-400 to-yellow-600 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-500 drop-shadow-[0_0_15px_rgba(255,215,0,1)] -mt-1" />
        </motion.div>

        {/* 右上侧长箭头 (Top Right Long Arrow) */}
        <motion.div
          animate={{ x: [0, -15, 0], y: [0, 15, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut", delay: 0.5 }}
          className="absolute -top-16 -right-16 z-10 flex flex-col items-center opacity-90 rotate-45"
        >
          <div className="w-2 h-32 bg-gradient-to-b from-transparent via-yellow-400 to-yellow-600 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]" />
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[30px] border-l-transparent border-r-transparent border-t-yellow-500 drop-shadow-[0_0_15px_rgba(255,215,0,1)] -mt-1" />
        </motion.div>

        <motion.div
          ref={wheelRef}
          animate={{ rotate: rotation }}
          transition={{
            duration: 5,
            ease: 'easeInOut',
          }}
          onAnimationComplete={handleAnimationComplete}
          className="relative drop-shadow-[0_0_35px_rgba(255,215,0,0.5)]"
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

        {/* 顶部主指针漂浮动画 (Floating Top Pointer) */}
        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="absolute -top-8 z-20 flex flex-col items-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-yellow-100 via-yellow-400 to-yellow-700 rounded-full border-4 border-white shadow-lg z-30 relative flex items-center justify-center">
            <div className="w-3 h-3 bg-red-600 rounded-full shadow-inner" />
          </div>
          <div className="w-0 h-0 border-l-[16px] border-r-[16px] border-t-[40px] border-l-transparent border-r-transparent border-t-yellow-400 -mt-2 z-20 drop-shadow-md" />
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
              <div className="bg-red-50 py-4 px-2 rounded-xl border border-red-100 mb-8 shadow-inner">
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
