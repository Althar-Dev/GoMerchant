
'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, useUser } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';
import { 
    RefreshCw, 
    Search, 
    X, 
    Trash2, 
    Edit2,
    ShieldAlert,
    CreditCard
} from 'lucide-react';

export default function AdminMembersPage() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    
    const [search, setSearch] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [editForm, setEditForm] = useState({ role: 'USER', saldo: 0 });

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
    }, [firestore]);

    const { data: users, isLoading } = useCollection<any>(usersQuery);

    const filteredUsers = users?.filter(u => 
        u.email?.toLowerCase().includes(search.toLowerCase()) || 
        u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
        u.telegramId?.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore || !selectedUser) return;
        setActionLoading(true);
        
        try {
            const res = await fetch('/api/admin/members', {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': authUser?.uid || ''
                },
                body: JSON.stringify({
                    userId: selectedUser.id,
                    role: editForm.role,
                    saldo: Number(editForm.saldo)
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                setShowEditModal(false);
            } else {
                alert(data.message || 'Gagal memperbarui data.');
            }
        } catch (err) {
            console.error('Update member failed:', err);
            alert('Kesalahan jaringan.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!firestore || !selectedUser) return;
        setActionLoading(true);
        
        try {
            deleteDocumentNonBlocking(doc(firestore, 'users', selectedUser.id));
            setShowDeleteModal(false);
        } catch (err) {
            console.error('Delete user failed:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const openEdit = (user: any) => {
        setSelectedUser(user);
        setEditForm({ role: user.role || 'USER', saldo: user.saldo || 0 });
        setShowEditModal(true);
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" /></div>;
    }

    return (
        <div className="space-y-8 animate-slide-up pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kelola Members</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Daftar seluruh pengguna aktif dalam sistem.</p>
                </div>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari email atau nama..." 
                        className="pl-10 !rounded-xl border-slate-200 text-sm font-bold" 
                    />
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>User Profile</th>
                                <th>Telegram ID</th>
                                <th>Status Plan</th>
                                <th>Saldo (IDR)</th>
                                <th className="text-right">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">User tidak ditemukan</td>
                                </tr>
                            ) : filteredUsers.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-sm ${u.role === 'ADMIN' ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400'}`}>
                                                {u.displayName?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{u.displayName || 'Member'}</p>
                                                <p className="text-[10px] text-slate-400 font-mono">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <p className="text-xs font-mono text-slate-600">{u.telegramId || '-'}</p>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest w-fit ${u.planId ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                {u.planId ? 'Active Plan' : 'Free Account'}
                                            </span>
                                            {u.planExpiresAt && (
                                                <p className="text-[9px] text-slate-400 font-medium">Exp: {new Date(u.planExpiresAt.seconds ? u.planExpiresAt.seconds * 1000 : u.planExpiresAt).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <p className="text-xs font-black text-slate-900">Rp {(u.saldo || 0).toLocaleString('id-ID')}</p>
                                    </td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <button onClick={() => openEdit(u)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors" title="Edit Member"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => { setSelectedUser(u); setShowDeleteModal(true); }} className="p-2 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors" title="Hapus Member"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Real Edit Modal */}
            {showEditModal && selectedUser && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowEditModal(false)}>
                    <div className="modal-content max-w-md !p-0 !rounded-2xl overflow-hidden border-none shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                            <h2 className="text-sm font-black uppercase tracking-widest">Update Member</h2>
                            <button onClick={() => setShowEditModal(false)} className="p-2 rounded-xl hover:bg-white/10 transition"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Hak Akses (Role)</label>
                                <select 
                                    value={editForm.role}
                                    onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                    className="!rounded-xl border-slate-200 font-bold text-sm"
                                >
                                    <option value="USER">USER (Regular Member)</option>
                                    <option value="ADMIN">ADMIN (Full Control)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Atur Saldo Manual (IDR)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                    <input 
                                        type="number" 
                                        value={editForm.saldo}
                                        onChange={e => setEditForm({ ...editForm, saldo: Number(e.target.value) })}
                                        className="!pl-11 !rounded-xl border-slate-200 font-black text-lg tracking-tight" 
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 mt-2 ml-1">Set saldo untuk member ini. Mutasi akan tercatat otomatis.</p>
                            </div>
                            <button type="submit" disabled={actionLoading} className="btn btn-primary w-full py-4 !rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100">
                                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                                Simpan Perubahan
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Real Delete Modal */}
            {showDeleteModal && selectedUser && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowDeleteModal(false)}>
                    <div className="modal-content max-w-sm !p-8 !rounded-2xl text-center shadow-2xl border-none" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Hapus Member?</h3>
                        <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed px-4">
                            Seluruh data akun **{selectedUser.email}** akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="btn btn-outline !rounded-xl font-bold uppercase tracking-widest text-[10px]">Batal</button>
                            <button onClick={handleDeleteUser} disabled={actionLoading} className="btn bg-rose-500 hover:bg-rose-600 text-white !rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-rose-100">
                                {actionLoading ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : null}
                                Ya, Hapus Akun
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
