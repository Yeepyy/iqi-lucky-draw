export interface Prize {
  id: string;
  name: string;
  probability: number;
  maxWinners: number;
  currentWinners: number;
  description?: string;
  imageUrl?: string;
  imagePath?: string;
}

export interface Participant {
  id: string;
  fullName: string;
  icPassport: string;
  phoneNumber: string;
  email: string;
  projectName: string;
  unitNumber: string;
  agentName: string;
  createdAt: Date;
  hasSpun: boolean;
}

export interface DrawResult {
  id: string;
  participantId: string;
  prizeId: string;
  prizeName: string;
  drawDate: Date;
  referenceNumber: string;
  acknowledgementSigned: boolean;
  signature?: string;
  participantDetails?: Participant;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'superadmin';
}

export interface DrawSession {
  id: string;
  participantId: string;
  prizeId: string;
  prizeName: string;
  referenceNumber: string;
  drawDate: string;
  acknowledgementSigned: boolean;
  signature?: string;
}
