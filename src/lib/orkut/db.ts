
'use client';

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { PendingTransaction, PaidTransaction } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Inisialisasi SDK Firebase Client
const { firestore } = initializeFirebase();

/**
 * Mengembalikan instance Firestore.
 */
export function getDb() {
  return firestore;
}

/**
 * Inisialisasi basis data.
 * Firestore bersifat schema-less, jadi ini hanya mengembalikan Promise kosong.
 */
export async function initDb(): Promise<void> {
  return Promise.resolve();
}

/**
 * Membersihkan transaksi yang sudah kadaluarsa.
 */
export async function cleanupExpired(): Promise<void> {
  const db = getDb();
  const now = Math.floor(Date.now() / 1000);

  try {
    // Cari transaksi pending yang kadaluarsa
    const pendingQuery = query(collection(db, 'orkut_pending'), where('expires_at', '<', now));
    const pendingSnap = await getDocs(pendingQuery);
    
    // Cari transaksi sukses yang kadaluarsa
    const paidQuery = query(collection(db, 'orkut_paid'), where('expires_at', '<', now));
    const paidSnap = await getDocs(paidQuery);

    // Hapus tanpa await (non-blocking) sesuai pedoman
    pendingSnap.forEach((d) => {
      deleteDoc(d.ref).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: d.ref.path,
          operation: 'delete'
        }));
      });
    });

    paidSnap.forEach((d) => {
      deleteDoc(d.ref).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: d.ref.path,
          operation: 'delete'
        }));
      });
    });
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

/**
 * Mencari akhiran unik (suffix) yang tersedia (1-999) untuk pengguna.
 */
export async function getAvailableSuffix(username: string): Promise<number> {
  // Jalankan pembersihan terlebih dahulu
  await cleanupExpired();
  
  const db = getDb();
  const q = query(collection(db, 'orkut_pending'), where('username', '==', username));
  const snap = await getDocs(q);

  const usedSet = new Set<number>();
  snap.forEach(d => {
    const data = d.data();
    if (data.unique_suffix) usedSet.add(data.unique_suffix);
  });

  // Cari angka dari 1 sampai 999 yang belum terpakai
  for (let i = 1; i <= 999; i++) {
    if (!usedSet.has(i)) return i;
  }

  throw new Error('Tidak ada kode unik yang tersedia saat ini');
}

/**
 * Membuat data transaksi pending baru.
 */
export async function createPendingTransaction(tx: PendingTransaction): Promise<void> {
  const db = getDb();
  const docRef = doc(db, 'orkut_pending', tx.id);
  
  // Non-blocking write
  setDoc(docRef, tx).catch(async () => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'create',
      requestResourceData: tx
    }));
  });
}

/**
 * Mengambil data transaksi pending berdasarkan ID.
 */
export async function getPendingTransaction(id: string): Promise<PendingTransaction | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, 'orkut_pending', id));
  if (!snap.exists()) return null;
  return snap.data() as PendingTransaction;
}

/**
 * Menghapus transaksi pending.
 */
export async function deletePendingTransaction(id: string): Promise<void> {
  const db = getDb();
  const docRef = doc(db, 'orkut_pending', id);
  
  // Non-blocking delete
  deleteDoc(docRef).catch(async () => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'delete'
    }));
  });
}

/**
 * Mencatat transaksi yang sudah berhasil dibayar.
 */
export async function createPaidTransaction(tx: PaidTransaction): Promise<void> {
  const db = getDb();
  const docRef = doc(db, 'orkut_paid', tx.id);
  
  // Non-blocking write
  setDoc(docRef, tx).catch(async () => {
    errorEmitter.emit('permission-error', new FirestorePermissionError({
      path: docRef.path,
      operation: 'create',
      requestResourceData: tx
    }));
  });
}

/**
 * Mengambil data transaksi sukses berdasarkan ID.
 */
export async function getPaidTransaction(id: string): Promise<PaidTransaction | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, 'orkut_paid', id));
  if (!snap.exists()) return null;
  return snap.data() as PaidTransaction;
}
