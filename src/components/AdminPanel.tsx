'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import {
  getAllPrizes,
  getAllParticipants,
  getAllDrawResults,
  addPrize,
  updatePrize,
  deletePrize,
} from '@/lib/database';
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Prize, Participant, DrawResult } from '@/types';
import AcknowledgementLetter from '@/components/AcknowledgementLetter';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'prizes' | 'participants' | 'results' | 'settings'>('prizes');
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [editingPrize, setEditingPrize] = useState<Prize | null>(null);
  const [prizeForm, setPrizeForm] = useState({
    name: '',
    probability: 10,
    maxWinners: 5,
    description: '',
  });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedResult, setSelectedResult] = useState<DrawResult | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participantForm, setParticipantForm] = useState({
    fullName: '',
    icPassport: '',
    phoneNumber: '',
    projectName: '',
    unitNumber: '',
    agentName: '',
    hasSpun: false,
  });
  const [formSettings, setFormSettings] = useState({
    showIC: true,
    showPhone: true,
    showEmail: true,
    showProject: true,
    showUnit: true,
    showAgent: true,
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [loginForm, setLoginForm] = useState({ id: '', password: '' });
  const [authSettings, setAuthSettings] = useState({ loginId: 'admin', password: 'coreteam123' });

  // === DERIVED STATE (Moved here to prevent 'use-before-define' build errors) ===
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = (items: any[]) => {
    if (!sortConfig) {
      return items;
    }
    return [...items].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'createdAt' || sortConfig.key === 'drawDate') {
        aValue = new Date((aValue as any)?.seconds ? (aValue as any).seconds * 1000 : aValue);
        bValue = new Date((bValue as any)?.seconds ? (bValue as any).seconds * 1000 : bValue);
      }

      if (activeTab === 'results' && sortConfig.key === 'winnerName') {
        const participantA = participants.find(p => p.id === a.participantId);
        const participantB = participants.find(p => p.id === b.participantId);
        aValue = participantA ? participantA.fullName : '';
        bValue = participantB ? participantB.fullName : '';
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  };

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
  };

  const filteredParticipants = participants.filter(p => {
    if (!searchTerm.trim()) return true;
    const lower = searchTerm.toLowerCase();
    return p.fullName.toLowerCase().includes(lower) || p.icPassport.toLowerCase().includes(lower) || p.phoneNumber.toLowerCase().includes(lower) || (p.agentName || '').toLowerCase().includes(lower);
  });

  const sortedPrizes = sortedItems(prizes) as Prize[];
  const sortedParticipants = sortedItems(filteredParticipants) as Participant[];
  const sortedResults = sortedItems(drawResults) as DrawResult[];
  // ==============================================================================

  useEffect(() => {
    const stored = sessionStorage.getItem('adminAuth');
    if (stored === 'true') setIsAuthenticated(true);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && isMounted) {
      loadData();
    }
  }, [isAuthenticated, isMounted]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Add a 10-second timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout. Please check your Firebase config.')), 10000)
      );

      const fetchSettings = async () => {
        try {
          const db = getFirestore();
          const d = await getDoc(doc(db, 'settings', 'formFields'));
          if (d.exists()) setFormSettings(d.data() as any);

          const authD = await getDoc(doc(db, 'settings', 'adminAuth'));
          if (authD.exists()) setAuthSettings(authD.data() as any);
        } catch (e) {}
      };

      const dataPromise = Promise.all([
        getAllPrizes(),
        getAllParticipants(),
        getAllDrawResults(),
        fetchSettings(),
      ]);

      const [prizeData, participantData, resultData] = await Promise.race([
        dataPromise,
        timeoutPromise,
      ]) as [Prize[], Participant[], DrawResult[]];

      setPrizes(prizeData);
      setParticipants(participantData);
      setDrawResults(resultData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPrize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prizeForm.name.trim()) {
      toast.error('Prize name is required');
      return;
    }

    setIsLoading(true);
    try {
      if (editingPrize) {
        await updatePrize(editingPrize.id, prizeForm);
        toast.success('Prize updated successfully');
      } else {
        await addPrize(prizeForm);
        toast.success('Prize added successfully');
      }
      await loadData();
      resetPrizeForm();
      setShowPrizeForm(false);
    } catch (error) {
      console.error('Error saving prize:', error);
      toast.error('Failed to save prize');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePrize = async (prizeId: string) => {
    if (!confirm('Are you sure you want to delete this prize?')) return;

    setIsLoading(true);
    try {
      await deletePrize(prizeId);
      toast.success('Prize deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting prize:', error);
      toast.error('Failed to delete prize');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPrize = (prize: Prize) => {
    setEditingPrize(prize);
    setPrizeForm({
      name: prize.name,
      probability: prize.probability,
      maxWinners: prize.maxWinners,
      description: prize.description || '',
    });
    setShowPrizeForm(true);
  };

  const resetPrizeForm = () => {
    setPrizeForm({
      name: '',
      probability: 10,
      maxWinners: 5,
      description: '',
    });
    setEditingPrize(null);
  };

  const handleDeleteParticipant = async (id: string) => {
    if (!confirm('Are you sure you want to delete this participant? This cannot be undone.')) return;
    setIsLoading(true);
    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'participants', id));
      toast.success('Participant deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting participant:', error);
      toast.error('Failed to delete participant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditParticipantClick = (p: Participant) => {
    setEditingParticipant(p);
    setParticipantForm({
      fullName: p.fullName,
      icPassport: p.icPassport,
      phoneNumber: p.phoneNumber,
      projectName: p.projectName || '',
      unitNumber: p.unitNumber || '',
      agentName: p.agentName || '',
      hasSpun: p.hasSpun || false,
    });
  };

  const handleUpdateParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParticipant) return;
    setIsLoading(true);
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'participants', editingParticipant.id), participantForm);
      toast.success('Participant updated successfully');
      setEditingParticipant(null);
      await loadData();
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error('Failed to update participant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteResult = async (id: string) => {
    if (!confirm('Are you sure you want to delete this draw result?')) return;
    setIsLoading(true);
    try {
      const db = getFirestore();
      const resultToDelete = drawResults.find(r => r.id === id);
      
      await deleteDoc(doc(db, 'drawResults', id));

      if (resultToDelete && resultToDelete.prizeId) {
        const prizeRef = doc(db, 'prizes', resultToDelete.prizeId);
        const prizeSnap = await getDoc(prizeRef);
        if (prizeSnap.exists()) {
          const current = prizeSnap.data().currentWinners || 0;
          await updateDoc(prizeRef, { currentWinners: Math.max(0, current - 1) });
        }
      }

      toast.success('Draw result deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting result:', error);
      toast.error('Failed to delete draw result');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllParticipants = async () => {
    if (!participants.length) return toast.error('No participants to delete');
    if (!confirm('🚨 WARNING: Are you sure you want to delete ALL participants?\n\nThis action cannot be undone!')) return;
    if (!confirm('FINAL WARNING: Are you ABSOLUTELY sure? This will wipe all customer data!')) return;
    
    setIsLoading(true);
    try {
      const db = getFirestore();
      await Promise.all(participants.map(p => deleteDoc(doc(db, 'participants', p.id))));
      toast.success('All participants deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting all participants:', error);
      toast.error('Failed to delete all participants');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllResults = async () => {
    if (!drawResults.length) return toast.error('No results to delete');
    if (!confirm('🚨 WARNING: Are you sure you want to delete ALL draw results?\n\nThis action cannot be undone!')) return;
    if (!confirm('FINAL WARNING: Are you ABSOLUTELY sure? This will wipe all spin records!')) return;

    setIsLoading(true);
    try {
      const db = getFirestore();
      await Promise.all(drawResults.map(r => deleteDoc(doc(db, 'drawResults', r.id))));
      
      // 重置所有奖品的 currentWinners 为 0
      await Promise.all(prizes.map(p => updateDoc(doc(db, 'prizes', p.id), { currentWinners: 0 })));
      
      toast.success('All draw results deleted successfully');
      await loadData();
    } catch (error) {
      console.error('Error deleting all results:', error);
      toast.error('Failed to delete all draw results');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const db = getFirestore();
      const authDoc = await getDoc(doc(db, 'settings', 'adminAuth'));
      
      let currentId = 'admin';
      let currentPass = 'coreteam123';
      
      if (authDoc.exists()) {
        const data = authDoc.data();
        currentId = data.loginId;
        currentPass = data.password;
      } else {
        await setDoc(doc(db, 'settings', 'adminAuth'), { loginId: currentId, password: currentPass });
      }

      if (loginForm.id === currentId && loginForm.password === currentPass) {
        setIsAuthenticated(true);
        sessionStorage.setItem('adminAuth', 'true');
        toast.success('Login successful');
      } else {
        toast.error('Invalid ID or Password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to verify credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAuthSettings = async () => {
    if (!authSettings.loginId.trim() || !authSettings.password.trim()) {
      return toast.error('ID and Password cannot be empty');
    }
    setIsLoading(true);
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'settings', 'adminAuth'), authSettings);
      toast.success('Admin authentication updated successfully!');
    } catch (e) {
      toast.error('Failed to save authentication settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleExportCSV = () => {
    let csvContent = '';
    let data: any[] = [];
    let headers: string[] = [];

    if (activeTab === 'participants') {
      headers = ['Full Name', 'IC/Passport', 'Phone', 'Email', 'Project', 'Unit', 'Agent Name', 'Has Spun', 'Date Joined'];
      data = sortedParticipants.map((p) => [
        p.fullName, 
        p.icPassport, 
        p.phoneNumber, 
        p.email, 
        p.projectName, 
        p.unitNumber, 
        p.agentName, 
        p.hasSpun ? 'Yes' : 'No',
        new Date((p.createdAt as any).seconds ? (p.createdAt as any).seconds * 1000 : p.createdAt).toLocaleString('en-MY')
      ]);
    } else if (activeTab === 'results') {
      headers = ['Reference', 'Winner Name', 'Prize', 'Date', 'Signed'];
      data = sortedResults.map((r: any) => {
        const participant = participants.find(p => p.id === r.participantId);
        return [
          r.referenceNumber,
          participant ? participant.fullName : 'N/A',
          r.prizeName,
          new Date(r.drawDate.seconds ? r.drawDate.seconds * 1000 : r.drawDate).toLocaleString('en-MY'),
          r.acknowledgementSigned ? 'Yes' : 'No',
        ];
      });
    } else if (activeTab === 'prizes') {
      headers = ['Prize Name', 'Probability', 'Max Winners', 'Current Winners'];
      data = sortedPrizes.map(p => [p.name, p.probability, p.maxWinners, p.currentWinners]);
    }

    csvContent = [headers, ...data].map((row) => row.map((cell: any) => `"${cell}"`).join(',')).join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    link.setAttribute('download', `${activeTab}-export-${new Date().toISOString()}.csv`);
    link.click();
    toast.success('CSV exported successfully');
  };

  // Prevent hydration mismatch by rendering a safe loading state until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Toaster position="top-center" />
        <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border-t-4 border-red-600 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 via-red-600 to-red-400"></div>
          <h2 className="text-3xl font-black text-center text-gray-800 mb-2">Admin Portal</h2>
          <p className="text-center text-gray-500 mb-8 font-medium">Please sign in to continue</p>
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Login ID</label>
              <input
                type="text"
                value={loginForm.id}
                onChange={(e) => setLoginForm({ ...loginForm, id: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-colors"
                placeholder="Enter login ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-colors"
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit" disabled={isLoading} className="w-full mt-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-lg font-black tracking-wider rounded-xl transition-all shadow-lg hover:shadow-red-500/30 disabled:opacity-50">
              {isLoading ? 'AUTHENTICATING...' : 'SECURE LOGIN ➔'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage prizes, participants, and draw results</p>
          </div>
          <button 
            onClick={() => {
              sessionStorage.removeItem('adminAuth');
              setIsAuthenticated(false);
              toast.success('Logged out successfully');
            }}
            className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
          >
            Logout ➔
          </button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['prizes', 'participants', 'results', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSortConfig(null); // Reset sort when changing tabs
                setSearchTerm('');
              }}
              className={`px-6 py-3 font-semibold border-b-4 transition-all ${
                activeTab === tab
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-600 border-transparent hover:text-gray-800'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'prizes' && (
          <div>
            <motion.button
              onClick={() => {
                resetPrizeForm();
                setShowPrizeForm(true);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mb-6 px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
            >
              + Add New Prize
            </motion.button>

            <AnimatePresence>
              {showPrizeForm && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="mb-6 p-6 bg-white rounded-lg shadow-lg border-l-4 border-red-600"
                >
                  <h3 className="text-xl font-bold mb-4">{editingPrize ? 'Edit Prize' : 'Add New Prize'}</h3>
                  <form onSubmit={handleAddPrize} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Prize Name</label>
                        <input
                          type="text"
                          value={prizeForm.name}
                          onChange={(e) => setPrizeForm({ ...prizeForm, name: e.target.value })}
                          className="w-full px-4 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="e.g., RM500 Furniture Voucher"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Probability (%)
                        </label>
                        <input
                          type="number"
                          value={prizeForm.probability}
                          onChange={(e) =>
                            setPrizeForm({ ...prizeForm, probability: parseFloat(e.target.value) })
                          }
                          className="w-full px-4 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          min="0"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Winners</label>
                        <input
                          type="number"
                          value={prizeForm.maxWinners}
                          onChange={(e) =>
                            setPrizeForm({ ...prizeForm, maxWinners: parseInt(e.target.value) })
                          }
                          className="w-full px-4 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          min="1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <input
                          type="text"
                          value={prizeForm.description}
                          onChange={(e) => setPrizeForm({ ...prizeForm, description: e.target.value })}
                          className="w-full px-4 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                          placeholder="Prize details"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {editingPrize ? 'Update Prize' : 'Add Prize'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPrizeForm(false);
                          resetPrizeForm();
                        }}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('name')}>
                      Prize Name{getSortIndicator('name')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('probability')}>
                      Probability{getSortIndicator('probability')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('maxWinners')}>
                      Max Winners{getSortIndicator('maxWinners')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('currentWinners')}>
                      Current Winners{getSortIndicator('currentWinners')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedPrizes.map((prize, index) => (
                    <motion.tr
                      key={prize.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-4 text-sm text-gray-800">{prize.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{prize.probability}%</td>
                      <td className="px-6 py-4 text-sm text-gray-800">{prize.maxWinners}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            prize.currentWinners >= prize.maxWinners
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {prize.currentWinners}/{prize.maxWinners}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => handleEditPrize(prize)}
                          className="mr-3 text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeletePrize(prize.id)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'participants' && (
          <div>
            <div className="mb-6 flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by name, phone, or IC..."
                className="flex-1 px-4 py-2 text-gray-900 bg-white placeholder-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
              <motion.button
                onClick={handleExportCSV}
                whileHover={{ scale: 1.05 }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                Export CSV
              </motion.button>
              <motion.button
                onClick={handleDeleteAllParticipants}
                whileHover={{ scale: 1.05 }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 whitespace-nowrap shadow-md"
              >
                Delete All
              </motion.button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('fullName')}>
                      Name{getSortIndicator('fullName')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('icPassport')}>
                      IC/Passport{getSortIndicator('icPassport')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('phoneNumber')}>
                      Phone{getSortIndicator('phoneNumber')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('projectName')}>
                      Project{getSortIndicator('projectName')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('agentName')}>
                      Agent Name{getSortIndicator('agentName')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('hasSpun')}>
                      Has Spun{getSortIndicator('hasSpun')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('createdAt')}>
                      Date Joined{getSortIndicator('createdAt')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedParticipants.map((p, index) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-3 text-gray-800">{p.fullName}</td>
                      <td className="px-4 py-3 text-gray-800">{p.icPassport}</td>
                      <td className="px-4 py-3 text-gray-800">{p.phoneNumber}</td>
                      <td className="px-4 py-3 text-gray-800 text-xs">{p.projectName}</td>
                      <td className="px-4 py-3 text-gray-800">{p.agentName || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            p.hasSpun
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {p.hasSpun ? '✓ Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {new Date((p.createdAt as any).seconds ? (p.createdAt as any).seconds * 1000 : p.createdAt).toLocaleString('en-MY')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleEditParticipantClick(p)}
                          className="mr-3 text-blue-600 hover:text-blue-800 font-semibold text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteParticipant(p.id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div>
            <div className="mb-6 flex gap-2">
              <motion.button
                onClick={handleExportCSV}
                whileHover={{ scale: 1.05 }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                Export CSV
              </motion.button>
              <motion.button
                onClick={handleDeleteAllResults}
                whileHover={{ scale: 1.05 }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 whitespace-nowrap shadow-md"
              >
                Delete All
              </motion.button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('referenceNumber')}>
                      Reference{getSortIndicator('referenceNumber')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('winnerName')}>
                      Winner Name{getSortIndicator('winnerName')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('prizeName')}>
                      Prize{getSortIndicator('prizeName')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('drawDate')}>
                      Draw Date{getSortIndicator('drawDate')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700 cursor-pointer" onClick={() => requestSort('acknowledgementSigned')}>
                      Signed{getSortIndicator('acknowledgementSigned')}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
              {sortedResults.map((result: any, index) => {
                const participant = participants.find(p => p.id === result.participantId);
                return (
                    <motion.tr
                      key={result.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-800">{result.referenceNumber}</td>
                  <td className="px-4 py-3 text-gray-800">{participant ? participant.fullName : 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-800">{result.prizeName}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {new Date(result.drawDate.seconds ? result.drawDate.seconds * 1000 : result.drawDate).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            result.acknowledgementSigned
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.acknowledgementSigned ? '✓ Signed' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-3 items-center">
                        <button
                          onClick={() => setSelectedResult(result)}
                          className="text-blue-600 hover:text-blue-800 font-semibold text-sm underline"
                        >
                          View Letter
                        </button>
                        <button
                          onClick={() => handleDeleteResult(result.id)}
                          className="text-red-600 hover:text-red-800 font-semibold text-sm underline"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
              )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Form Field Settings</h2>
              <p className="text-gray-600 text-sm mt-1">Toggle which fields clients are required to fill in during registration.</p>
            </div>
            <div className="p-6 space-y-4">
              {[
                { id: 'showIC', label: 'IC / Passport No.' },
                { id: 'showPhone', label: 'Phone Number' },
                { id: 'showEmail', label: 'Email Address' },
                { id: 'showProject', label: 'Project Name' },
                { id: 'showUnit', label: 'Unit Number' },
                { id: 'showAgent', label: 'Agent Name' },
              ].map(field => (
                <div key={field.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-700">{field.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={(formSettings as any)[field.id]}
                      onChange={(e) => setFormSettings({...formSettings, [field.id]: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              ))}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <motion.button
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      const db = getFirestore();
                      await setDoc(doc(db, 'settings', 'formFields'), formSettings);
                      toast.success('Settings saved successfully!');
                    } catch (e) {
                      toast.error('Failed to save settings');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors"
                >
                  Save Settings
                </motion.button>
              </div>
            </div>
            </div>

            <div className="bg-white rounded-lg shadow border-t-4 border-gray-800">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">Admin Authentication</h2>
                <p className="text-gray-600 text-sm mt-1">Update the login ID and password for the admin portal.</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Login ID</label>
                  <input
                    type="text"
                    value={authSettings.loginId}
                    onChange={(e) => setAuthSettings({...authSettings, loginId: e.target.value})}
                    className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                  <input
                    type="text"
                    value={authSettings.password}
                    onChange={(e) => setAuthSettings({...authSettings, password: e.target.value})}
                    className="w-full px-4 py-3 text-gray-900 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-colors"
                  />
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <motion.button
                    onClick={handleSaveAuthSettings}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full px-6 py-4 bg-gray-800 text-white rounded-xl font-bold tracking-wide hover:bg-gray-900 transition-colors shadow-md"
                  >
                    Save Login Settings
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Participant Modal */}
        <AnimatePresence>
          {editingParticipant && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <div className="bg-white p-8 rounded-2xl w-full max-w-lg shadow-2xl">
                <h3 className="text-2xl font-bold mb-6 text-gray-800">Edit Participant</h3>
                <form onSubmit={handleUpdateParticipant} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <input type="text" value={participantForm.fullName} onChange={e => setParticipantForm({...participantForm, fullName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IC / Passport</label>
                      <input type="text" value={participantForm.icPassport} onChange={e => setParticipantForm({...participantForm, icPassport: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input type="text" value={participantForm.phoneNumber} onChange={e => setParticipantForm({...participantForm, phoneNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Agent Name</label>
                      <input type="text" value={participantForm.agentName} onChange={e => setParticipantForm({...participantForm, agentName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                      <input type="text" value={participantForm.projectName} onChange={e => setParticipantForm({...participantForm, projectName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Number</label>
                      <input type="text" value={participantForm.unitNumber} onChange={e => setParticipantForm({...participantForm, unitNumber: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 outline-none" />
                    </div>
                    <div className="col-span-2 flex items-center mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={participantForm.hasSpun} onChange={e => setParticipantForm({...participantForm, hasSpun: e.target.checked})} className="w-5 h-5 rounded text-red-600" />
                        <span className="text-sm font-medium text-gray-700">Has Spun (Uncheck to allow spinning again)</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-8">
                    <button type="button" onClick={() => setEditingParticipant(null)} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">Cancel</button>
                    <button type="submit" disabled={isLoading} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50">Save Changes</button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Letter Preview Modal */}
        <AnimatePresence>
          {selectedResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-start justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            >
              <div className="relative w-full max-w-3xl my-8">
                {participants.find(p => p.id === selectedResult.participantId) ? (
                  <AcknowledgementLetter
                    drawResult={selectedResult}
                    participant={participants.find(p => p.id === selectedResult.participantId)!}
                    prizeName={selectedResult.prizeName}
                    onClose={() => setSelectedResult(null)}
                  />
                ) : (
                  <div className="bg-white p-8 rounded-lg text-center">
                    <p className="text-red-600 mb-4 font-bold">Error: Participant details not found.</p>
                    <button onClick={() => setSelectedResult(null)} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg">Close</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg">
              <p className="text-gray-800 font-semibold">Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
