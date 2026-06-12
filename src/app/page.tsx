'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import UserForm from '@/components/UserForm';
import SpinWheel from '@/components/SpinWheel';
import AcknowledgementLetter from '@/components/AcknowledgementLetter';
import {
  addParticipant,
  checkParticipantDuplicates,
  getAllPrizes,
  savDrawResult,
  getSetting,
} from '@/lib/database';
import { Prize, Participant, DrawResult } from '@/types';
import { FormSettings } from '@/components/UserForm';
import { DEFAULT_WHEEL_COLORS, normalizeWheelColors } from '@/lib/wheelColors';

export const dynamic = 'force-dynamic';

type PageState = 'form' | 'wheel' | 'result';

function LuckyDrawClient({ agentName }: { agentName: string }) {
  const [pageState, setPageState] = useState<PageState>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [drawResult, setDrawResult] = useState<DrawResult | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [formSettings, setFormSettings] = useState<FormSettings | null>(null);
  const [wheelColors, setWheelColors] = useState(DEFAULT_WHEEL_COLORS);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const prizeData = await getAllPrizes();
      setPrizes(prizeData);

      const [fields, colors] = await Promise.all([
        getSetting('formFields', { showIC: true, showPhone: true, showEmail: true, showProject: true, showUnit: true, showAgent: true }),
        getSetting('wheelColors', DEFAULT_WHEEL_COLORS),
      ]);
      setFormSettings(fields);
      setWheelColors(normalizeWheelColors(colors));
    } catch (error) {
      console.error('Error loading initial data:', error);
      setFormSettings({ showIC: true, showPhone: true, showEmail: true, showProject: true, showUnit: true, showAgent: true });
    }
  };

  const handleFormSubmit = async (formData: any) => {
    setIsLoading(true);
    try {
      const duplicateFields = await checkParticipantDuplicates(
        formData.icPassport?.trim() || '',
        formData.email?.trim() || '',
        formData.phoneNumber?.trim() || '',
      );

      if (duplicateFields.length) {
        toast.error(`${duplicateFields.join(', ')} already registered. Please contact your Agent.`);
        setIsLoading(false);
        return;
      }

      const newParticipant = await addParticipant({
        fullName: formData.fullName,
        icPassport: formData.icPassport,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        projectName: formData.projectName,
        unitNumber: formData.unitNumber,
        agentName: formData.agentName,
      });

      setParticipant(newParticipant);
      setPageState('wheel');
      toast.success('Registration successful! Ready to spin!');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpinComplete = async (winningPrize: Prize) => {
    if (!participant) return;

    try {
      const result = await savDrawResult({
        participantId: participant.id,
        prizeId: winningPrize.id,
        prizeName: winningPrize.name,
      } as any);

      setDrawResult(result);
      setPageState('result');
      toast.success('Congratulations! You won!');
    } catch (error: any) {
      console.error('Error saving result:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  const handleReset = () => {
    setPageState('form');
    setParticipant(null);
    setDrawResult(null);
    setIsSpinning(false);
  };

  return (
    <>
      <Toaster position="top-center" />
      <main 
        className="min-h-screen bg-black bg-cover bg-center bg-no-repeat bg-fixed flex items-center justify-center px-4 py-8 relative"
        style={{ backgroundImage: "url('/bg.jpg')" }}
      >
        {/* Premium Dark Glass Overlay */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>

        <div className="w-full max-w-4xl relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {/* Main Company Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src="/logo.png" 
                alt="Company Logo" 
                className="h-24 md:h-32 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] tracking-tight">
              Spin & Win Lucky Draw
            </h1>
            <p className="text-xl text-gray-200 mb-2 font-light tracking-wide">Client Appreciation Campaign</p>
            <p className="text-yellow-500 opacity-90">Win amazing rewards by spinning the wheel!</p>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-4xl mx-auto"
          >
            {pageState === 'form' && formSettings && (
              <UserForm
                onSubmit={handleFormSubmit}
                isLoading={isLoading}
              fixedAgentName={agentName}
                formSettings={formSettings}
              />
            )}

            {pageState === 'wheel' && participant && (
              <div className="space-y-8 py-8 bg-black/40 backdrop-blur-md rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-yellow-500/30">
                <div className="text-center mb-8">
                  <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-3 drop-shadow-lg">Welcome, {participant.fullName.split(' ')[0]}!</h2>
                  <p className="text-gray-200 text-lg font-light tracking-wide">Click the button below to spin the wheel and win a prize!</p>
                </div>
                
                <SpinWheel
                  prizes={prizes}
                  onSpinStart={() => setIsSpinning(true)}
                  onSpinComplete={handleSpinComplete}
                  isSpinning={isSpinning}
                  colors={wheelColors}
                />

                <div className="text-center mt-12 pb-4">
                  <motion.button
                    onClick={handleReset}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-3 bg-black/60 border border-gray-600 hover:bg-black hover:border-yellow-500 hover:text-yellow-400 text-gray-300 rounded-full font-semibold transition-all duration-300 shadow-lg"
                  >
                    ← Back to Registration
                  </motion.button>
                </div>
              </div>
            )}

            {pageState === 'result' && drawResult && participant && (
              <div className="space-y-6">
                <AcknowledgementLetter
                  drawResult={drawResult}
                  participant={participant}
                  prizeName={drawResult.prizeName}
                  prizeImageUrl={prizes.find((prize) => prize.id === drawResult.prizeId)?.imageUrl}
                  onClose={handleReset}
                />
              </div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-12 text-gray-500 text-sm"
          >
            <p>Thank you for your participation. Terms and conditions apply.</p>
          </motion.div>
        </div>
      </main>
    </>
  );
}

function AgentPortal() {
  const [agentInput, setAgentInput] = useState('');
  const [clientLink, setClientLink] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentInput.trim()) {
      toast.error('Please enter your Agent Name');
      return;
    }
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    setClientLink(`${baseUrl}/?agent=${encodeURIComponent(agentInput.trim())}`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(clientLink);
    toast.success('Link copied to clipboard!');
  };

  return (
    <main 
      className="min-h-screen bg-black bg-cover bg-center bg-no-repeat bg-fixed flex items-center justify-center px-4 py-8 relative"
      style={{ backgroundImage: "url('/bg.jpg')" }}
    >
      {/* Premium Dark Glass Overlay */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-black/60 backdrop-blur-md rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.6)] p-8 border border-gray-700/50 relative z-10"
      >
        <div className="text-center mb-8">
          {/* Agent Portal Company Logo */}
          <div className="flex justify-center mb-6">
            <img 
              src="/logo.png" 
              alt="Company Logo" 
              className="h-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 mb-2 drop-shadow-md">Agent Portal</h1>
          <p className="text-gray-300 font-light">Generate your exclusive client lucky draw link</p>
        </div>

        {!clientLink ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2 ml-1">
                Enter Your Agent Name
              </label>
              <input
                type="text"
                value={agentInput}
                onChange={(e) => setAgentInput(e.target.value)}
                className="w-full px-4 py-3 text-gray-900 bg-white/90 placeholder-gray-500 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white focus:shadow-[0_0_15px_rgba(255,215,0,0.5)] transition-all duration-300"
                placeholder="e.g., John Doe"
              />
            </div>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl text-lg font-black tracking-wider transition-all duration-300 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]"
            >
              Generate Link
            </motion.button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-5 bg-green-500/20 border border-green-500/50 rounded-xl backdrop-blur-sm">
              <p className="text-green-300 font-bold mb-2">Your link is ready! ✓</p>
              <p className="text-sm text-green-100/80 mb-4 font-light">
                Send this link to your clients. They won&apos;t need to fill in the Agent Name manually.
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={clientLink}
                  className="flex-1 px-3 py-2 text-sm text-gray-800 bg-white/90 border border-gray-300 rounded-lg focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-yellow-500 text-black text-sm font-bold rounded-lg hover:bg-yellow-400 shadow-md transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            <button
              onClick={() => setClientLink('')}
              className="w-full py-3 text-sm font-semibold text-gray-400 hover:text-white transition-colors"
            >
              Generate another link
            </button>
          </div>
        )}
        
        <div className="mt-8 text-center border-t pt-6 border-gray-700/50">
           <a href="/admin" className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">Go to Admin Dashboard ➔</a>
        </div>
      </motion.div>
    </main>
  );
}

function MainContent() {
  const searchParams = useSearchParams();
  const agent = searchParams.get('agent');

  if (!agent) {
    return <AgentPortal />;
  }

  return <LuckyDrawClient agentName={agent} />;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>}>
      <MainContent />
    </Suspense>
  );
}
