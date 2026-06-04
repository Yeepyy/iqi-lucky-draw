'use client';

import {
  collection,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Prize, Participant, DrawResult } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// PARTICIPANTS COLLECTION
export async function addParticipant(data: Omit<Participant, 'id' | 'createdAt' | 'hasSpun'>) {
  try {
    const docRef = await addDoc(collection(db, 'participants'), {
      ...data,
      createdAt: Timestamp.now(),
      hasSpun: false,
    });
    return {
      id: docRef.id,
      ...data,
      createdAt: new Date(),
      hasSpun: false,
    };
  } catch (error) {
    console.error('Error adding participant:', error);
    throw error;
  }
}

export async function checkParticipantExists(icPassport: string, phoneNumber: string) {
  try {
    const q = query(
      collection(db, 'participants'),
      where('icPassport', '==', icPassport)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking participant:', error);
    throw error;
  }
}

export async function getParticipantByIC(icPassport: string) {
  try {
    const q = query(
      collection(db, 'participants'),
      where('icPassport', '==', icPassport)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Participant;
  } catch (error) {
    console.error('Error getting participant:', error);
    throw error;
  }
}

export async function getAllParticipants() {
  try {
    const snapshot = await getDocs(collection(db, 'participants'));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Participant[];
  } catch (error) {
    console.error('Error getting participants:', error);
    throw error;
  }
}

export async function searchParticipants(searchTerm: string) {
  try {
    const snapshot = await getDocs(collection(db, 'participants'));
    const lowerSearchTerm = searchTerm.toLowerCase();
    return snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(
        (p: any) =>
          p.fullName.toLowerCase().includes(lowerSearchTerm) ||
          p.phoneNumber.includes(searchTerm) ||
          p.icPassport.includes(searchTerm)
      ) as Participant[];
  } catch (error) {
    console.error('Error searching participants:', error);
    throw error;
  }
}

// PRIZES COLLECTION
export async function addPrize(data: Omit<Prize, 'id' | 'currentWinners'>) {
  try {
    const docRef = await addDoc(collection(db, 'prizes'), {
      ...data,
      currentWinners: 0,
    });
    return { id: docRef.id, currentWinners: 0, ...data };
  } catch (error) {
    console.error('Error adding prize:', error);
    throw error;
  }
}

export async function getAllPrizes() {
  try {
    const snapshot = await getDocs(collection(db, 'prizes'));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Prize[];
  } catch (error) {
    console.error('Error getting prizes:', error);
    throw error;
  }
}

export async function updatePrize(prizeId: string, data: Partial<Prize>) {
  try {
    await updateDoc(doc(db, 'prizes', prizeId), data);
  } catch (error) {
    console.error('Error updating prize:', error);
    throw error;
  }
}

export async function deletePrize(prizeId: string) {
  try {
    await deleteDoc(doc(db, 'prizes', prizeId));
  } catch (error) {
    console.error('Error deleting prize:', error);
    throw error;
  }
}

// DRAW RESULTS COLLECTION
export async function savDrawResult(data: Omit<DrawResult, 'id' | 'drawDate' | 'referenceNumber' | 'acknowledgementSigned'>) {
  try {
    const referenceNumber = generateReferenceNumber();
    const docRef = await addDoc(collection(db, 'drawResults'), {
      ...data,
      referenceNumber,
      drawDate: Timestamp.now(),
      acknowledgementSigned: false,
    });

    // Update participant hasSpun flag
    const participantRef = doc(db, 'participants', data.participantId);
    await updateDoc(participantRef, { hasSpun: true });

    // Increment prize winner count
    const prizeRef = doc(db, 'prizes', data.prizeId);
    const prizeSnap = await getDoc(prizeRef);
    if (prizeSnap.exists()) {
      const currentWinners = (prizeSnap.data()?.currentWinners || 0) + 1;
      await updateDoc(prizeRef, { currentWinners });
    }

    return { id: docRef.id, referenceNumber, ...data, drawDate: new Date(), acknowledgementSigned: false };
  } catch (error) {
    console.error('Error saving draw result:', error);
    throw error;
  }
}

export async function getDrawResultByParticipant(participantId: string) {
  try {
    const q = query(
      collection(db, 'drawResults'),
      where('participantId', '==', participantId)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as DrawResult;
  } catch (error) {
    console.error('Error getting draw result:', error);
    throw error;
  }
}

export async function getAllDrawResults() {
  try {
    const snapshot = await getDocs(collection(db, 'drawResults'));
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as DrawResult[];
  } catch (error) {
    console.error('Error getting draw results:', error);
    throw error;
  }
}

export async function updateDrawResultSignature(drawResultId: string, signed: boolean, signature?: string) {
  try {
    await updateDoc(doc(db, 'drawResults', drawResultId), {
      acknowledgementSigned: signed,
      ...(signature && { signature }),
    });
  } catch (error) {
    console.error('Error updating draw result:', error);
    throw error;
  }
}

// UTILITY FUNCTIONS
export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `LD-${year}-${randomNum}`;
}

// SELECT WINNING PRIZE BASED ON PROBABILITY
export async function selectWinningPrize(prizes: Prize[]): Promise<Prize | null> {
  // Filter prizes that haven't reached max winners
  const availablePrizes = prizes.filter((p) => p.currentWinners < p.maxWinners);

  if (availablePrizes.length === 0) {
    return null; // No prizes available
  }

  // Calculate total probability
  const totalProbability = availablePrizes.reduce((sum, p) => sum + p.probability, 0);
  if (totalProbability === 0) return availablePrizes[0]; // Fallback

  // Generate random number and select prize
  let random = Math.random() * totalProbability;
  for (const prize of availablePrizes) {
    random -= prize.probability;
    if (random <= 0) {
      return prize;
    }
  }

  return availablePrizes[0]; // Fallback
}
