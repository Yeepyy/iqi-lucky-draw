'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import AdminPanel from '@/components/AdminPanel';

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return (
    <>
      <Toaster position="top-center" />
      <AdminPanel />
    </>
  );
}
