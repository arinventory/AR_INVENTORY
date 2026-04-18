
'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Smartphone, 
  Mail, 
  FileText, 
  Package, 
  ShieldAlert, 
  UserCog,
  User,
  Fingerprint
} from 'lucide-react';
import { Button, Input, Select, Card, toast } from '../components/UIComponents';

// --- TYPES ---

type UserRole = 'Admin' | 'Staff' | 'Read-Only';

interface UserPermissions {
  editBills: boolean;
  editStock: boolean;
  authorizeNonGst: boolean;
}

interface User {
  id: string;
  username: string; // Email
  staffCode: string;
  phone: string;
  role: UserRole;
  permissions: UserPermissions;
  is2FAEnabled: boolean;
}

// --- MOCK DATA ---

const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'manager@maison.com',
    staffCode: 'STF-001',
    phone: '9876543210',
    role: 'Admin',
    permissions: { editBills: true, editStock: true, authorizeNonGst: true },
    is2FAEnabled: true
  },
  {
    id: '2',
    username: 'sales.counters@maison.com',
    staffCode: 'STF-005',
    phone: '9988776655',
    role: 'Staff',
    permissions: { editBills: true, editStock: false, authorizeNonGst: false },
    is2FAEnabled: false
  },
  {
    id: '3',
    username: 'audit.external@maison.com',
    staffCode: 'AUD-001',
    phone: '8877665544',
    role: 'Read-Only',
    permissions: { editBills: false, editStock: false, authorizeNonGst: false },
    is2FAEnabled: true
  }
];

// --- COMPONENTS ---

const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const styles = {
    'Admin': 'bg-gold-100 text-gold-700 border-gold-200',
    'Staff': 'bg-charcoal-100 text-charcoal-700 border-charcoal-200',
    'Read-Only': 'bg-gray-100 text-gray-500 border-gray-200'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${styles[role]}`}>
      {role}
    </span>
  );
};

const PermissionIcon: React.FC<{ active: boolean; icon: React.ReactNode; label: string }> = ({ active, icon, label }) => (
  <div title={label} className={`p-1.5 rounded-full flex items-center justify-center ${active ? 'bg-gold-50 text-gold-600' : 'bg-gray-50 text-gray-300'}`}>
    {icon}
  </div>
);

export const Users: React.FC = () => {
  // --- STATE ---
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const initialForm = {
    username: '',
    password: '', // In real app, handle separately
    staffCode: '',
    phone: '',
    role: 'Staff' as UserRole,
    editBills: false,
    editStock: false,
    authorizeNonGst: false,
    is2FAEnabled: false
  };
  const [formData, setFormData] = useState(initialForm);

  // --- LOGIC ---

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter(u => 
      u.username.toLowerCase().includes(term) || 
      u.staffCode.toLowerCase().includes(term) ||
      u.phone.includes(term)
    );
  }, [users, searchTerm]);

  // --- HANDLERS ---

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      staffCode: user.staffCode,
      phone: user.phone,
      role: user.role,
      editBills: user.permissions.editBills,
      editStock: user.permissions.editStock,
      authorizeNonGst: user.permissions.authorizeNonGst,
      is2FAEnabled: user.is2FAEnabled
    });
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData(initialForm);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.username || !formData.staffCode) {
      toast({ title: 'Validation Error', description: 'Username and Staff Code are required.', variant: 'destructive' });
      return;
    }

    const newUser: User = {
      id: editingUser ? editingUser.id : Date.now().toString(),
      username: formData.username,
      staffCode: formData.staffCode,
      phone: formData.phone,
      role: formData.role,
      permissions: {
        editBills: formData.editBills,
        editStock: formData.editStock,
        authorizeNonGst: formData.authorizeNonGst
      },
      is2FAEnabled: formData.is2FAEnabled
    };

    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? newUser : u));
      toast({ title: 'User Updated', description: `Permissions updated for ${newUser.staffCode}` });
    } else {
      setUsers([...users, newUser]);
      toast({ title: 'User Created', description: `New ${newUser.role} added.` });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to revoke access for this user?')) {
      setUsers(users.filter(u => u.id !== id));
      toast({ title: 'Access Revoked', description: 'User removed from system.' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#FDFBF7] text-[#2D2A26] font-sans relative">
      
      {/* 1. HEADER & COMMAND BAR */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-charcoal-900 text-gold-500 flex items-center justify-center shadow-md">
                 <UserCog size={20} />
             </div>
             <div>
                 <h2 className="text-xl font-bold text-charcoal-900 tracking-tight leading-none">Security & Access</h2>
                 <p className="text-xs text-gray-500 font-medium mt-1">
                    Manage Staff Permissions & Roles
                 </p>
             </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-500" size={16} />
                <input 
                   type="text"
                   placeholder="Search by name, email, or staff code..."
                   className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-md text-charcoal-900 placeholder-gray-400 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 shadow-sm transition-all text-sm"
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <Button onClick={handleOpenAdd} className="bg-gradient-to-r from-gold-500 to-gold-600 shadow-lg hover:shadow-gold-500/20 gap-2 px-6">
                <Plus size={18} /> Add Authorized User
            </Button>
         </div>
      </div>

      {/* 2. USER GRID */}
      <div className="flex-1 overflow-auto p-8">
         <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden min-h-[500px] flex flex-col">
            <div className="overflow-auto flex-1">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase text-[11px] tracking-wider sticky top-0 z-10">
                     <tr>
                        <th className="py-4 px-6">User Identity</th>
                        <th className="py-4 px-6 text-right">Staff Code</th>
                        <th className="py-4 px-6 text-right">Contact</th>
                        <th className="py-4 px-6 text-center">Role</th>
                        <th className="py-4 px-6 text-center">Permissions</th>
                        <th className="py-4 px-6 text-center">2FA Security</th>
                        <th className="py-4 px-6 text-center w-32">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                     {filteredUsers.length === 0 ? (
                        <tr>
                           <td colSpan={7} className="py-20 text-center">
                              <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                                 <div className="w-16 h-16 rounded-full bg-gold-50 border-2 border-gold-200 flex items-center justify-center">
                                    <ShieldAlert size={32} className="text-gold-500"/>
                                 </div>
                                 <p className="font-serif text-lg text-gray-400">No authorized users found matching your search.</p>
                              </div>
                           </td>
                        </tr>
                     ) : (
                        filteredUsers.map(user => (
                           <tr key={user.id} className="hover:bg-gold-50/20 transition-colors group">
                              <td className="py-4 px-6">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-charcoal-600 font-bold border border-gray-200">
                                       {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                       <p className="font-bold text-charcoal-900">{user.username}</p>
                                       <p className="text-[10px] text-gray-400 font-mono">ID: {user.id}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="py-4 px-6 text-right font-mono font-bold text-gray-600">{user.staffCode}</td>
                              <td className="py-4 px-6 text-right font-mono text-gray-500 text-xs">{user.phone}</td>
                              <td className="py-4 px-6 text-center">
                                 <RoleBadge role={user.role} />
                              </td>
                              <td className="py-4 px-6">
                                 <div className="flex items-center justify-center gap-2">
                                    <PermissionIcon active={user.permissions.editBills} icon={<FileText size={14}/>} label="Edit Bills"/>
                                    <PermissionIcon active={user.permissions.editStock} icon={<Package size={14}/>} label="Edit Stock"/>
                                    <PermissionIcon active={user.permissions.authorizeNonGst} icon={<Shield size={14}/>} label="Auth Non-GST"/>
                                 </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                 {user.is2FAEnabled ? (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-full border border-green-100 text-[10px] font-bold uppercase">
                                       <CheckCircle2 size={12}/> Enabled
                                    </div>
                                 ) : (
                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-50 text-gray-400 rounded-full border border-gray-200 text-[10px] font-bold uppercase">
                                       <XCircle size={12}/> Disabled
                                    </div>
                                 )}
                              </td>
                              <td className="py-4 px-6 text-center">
                                 <div className="flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                       onClick={() => handleEdit(user)}
                                       className="text-gold-600 hover:text-gold-700 font-bold text-xs flex items-center gap-1"
                                    >
                                       Edit
                                    </button>
                                    <button 
                                       onClick={() => handleDelete(user.id)}
                                       className="text-red-400 hover:text-red-600 font-bold text-xs flex items-center gap-1"
                                    >
                                       Delete
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
            <div className="bg-gray-50 border-t border-gray-200 p-3 text-xs text-gray-400 flex justify-between px-6">
               <span>Total Users: {users.length}</span>
               <span>Admin Access Level: Root</span>
            </div>
         </div>
      </div>

      {/* 3. ADD/EDIT USER MODAL */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 bg-charcoal-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 overflow-hidden">
               
               {/* Modal Header */}
               <div className="bg-charcoal-900 text-white px-8 py-5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-gold-500 rounded text-charcoal-900">
                        <UserCog size={20}/>
                     </div>
                     <div>
                        <h3 className="font-serif text-lg font-bold tracking-wide">
                           {editingUser ? 'Edit User Credentials' : 'Add New User'}
                        </h3>
                        <p className="text-xs text-gray-400">Configure access rights and identity</p>
                     </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                     <XCircle size={24}/>
                  </button>
               </div>

               {/* Modal Body */}
               <div className="p-8 bg-gray-50/50 flex-1 overflow-auto">
                  <div className="grid grid-cols-2 gap-8">
                     
                     {/* COL 1: IDENTITY */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2 text-gold-600 border-b border-gray-200 pb-2">
                           <User size={16}/>
                           <span className="text-xs font-bold uppercase tracking-widest">Identity</span>
                        </div>
                        
                        <div className="space-y-4">
                           <Input 
                              label="Username / Email" 
                              placeholder="user@maison.com" 
                              icon={<Mail size={14}/>}
                              value={formData.username}
                              onChange={e => setFormData({...formData, username: e.target.value})}
                           />
                           <Input 
                              label="Password" 
                              type="password" 
                              placeholder="••••••••" 
                              icon={<Lock size={14}/>}
                              value={formData.password}
                              onChange={e => setFormData({...formData, password: e.target.value})}
                           />
                           <div className="grid grid-cols-2 gap-4">
                              <Input 
                                 label="Staff Code" 
                                 placeholder="STF-000" 
                                 isMonospaced
                                 value={formData.staffCode}
                                 onChange={e => setFormData({...formData, staffCode: e.target.value})}
                              />
                              <Input 
                                 label="Phone" 
                                 placeholder="Mobile" 
                                 icon={<Smartphone size={14}/>}
                                 value={formData.phone}
                                 onChange={e => setFormData({...formData, phone: e.target.value})}
                              />
                           </div>
                           <Select 
                              label="System Role"
                              value={formData.role}
                              onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                              options={[
                                 {value: 'Admin', label: 'Admin (Full Access)'},
                                 {value: 'Staff', label: 'Staff (Restricted)'},
                                 {value: 'Read-Only', label: 'Auditor (Read Only)'},
                              ]}
                           />
                        </div>
                     </div>

                     {/* COL 2: SECURITY & PERMISSIONS */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-2 mb-2 text-gold-600 border-b border-gray-200 pb-2">
                           <Shield size={16}/>
                           <span className="text-xs font-bold uppercase tracking-widest">Security & Access</span>
                        </div>

                        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm space-y-4">
                           <label className="flex items-center justify-between cursor-pointer group">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.editBills ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <FileText size={16}/>
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-charcoal-900 group-hover:text-gold-600 transition-colors">Edit Bills</p>
                                    <p className="text-[10px] text-gray-400">Allow modification of finalized invoices</p>
                                 </div>
                              </div>
                              <input 
                                 type="checkbox" 
                                 className="accent-gold-500 w-4 h-4"
                                 checked={formData.editBills}
                                 onChange={e => setFormData({...formData, editBills: e.target.checked})}
                              />
                           </label>
                           
                           <label className="flex items-center justify-between cursor-pointer group">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.editStock ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Package size={16}/>
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-charcoal-900 group-hover:text-gold-600 transition-colors">Edit Stock</p>
                                    <p className="text-[10px] text-gray-400">Add, remove or update inventory items</p>
                                 </div>
                              </div>
                              <input 
                                 type="checkbox" 
                                 className="accent-gold-500 w-4 h-4"
                                 checked={formData.editStock}
                                 onChange={e => setFormData({...formData, editStock: e.target.checked})}
                              />
                           </label>

                           <label className="flex items-center justify-between cursor-pointer group">
                              <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.authorizeNonGst ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                                    <ShieldAlert size={16}/>
                                 </div>
                                 <div>
                                    <p className="text-sm font-bold text-charcoal-900 group-hover:text-gold-600 transition-colors">Authorize Non-GST</p>
                                    <p className="text-[10px] text-gray-400">Permit tax-exempt transactions</p>
                                 </div>
                              </div>
                              <input 
                                 type="checkbox" 
                                 className="accent-gold-500 w-4 h-4"
                                 checked={formData.authorizeNonGst}
                                 onChange={e => setFormData({...formData, authorizeNonGst: e.target.checked})}
                              />
                           </label>
                           
                           <div className="border-t border-gray-100 pt-3 mt-2">
                              <label className="flex items-center justify-between cursor-pointer group">
                                 <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${formData.is2FAEnabled ? 'bg-charcoal-900 text-gold-500' : 'bg-gray-100 text-gray-400'}`}>
                                       <Fingerprint size={16}/>
                                    </div>
                                    <div>
                                       <p className="text-sm font-bold text-charcoal-900 group-hover:text-gold-600 transition-colors">Two-Factor Auth</p>
                                       <p className="text-[10px] text-gray-400">Require OTP for login</p>
                                    </div>
                                 </div>
                                 <div className={`w-10 h-5 rounded-full relative transition-colors ${formData.is2FAEnabled ? 'bg-gold-500' : 'bg-gray-300'}`}>
                                    <input 
                                       type="checkbox" 
                                       className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                       checked={formData.is2FAEnabled}
                                       onChange={e => setFormData({...formData, is2FAEnabled: e.target.checked})}
                                    />
                                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${formData.is2FAEnabled ? 'left-6' : 'left-1'}`}/>
                                 </div>
                              </label>
                           </div>
                        </div>
                     </div>

                  </div>
               </div>

               {/* Modal Footer */}
               <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleSave} className="bg-charcoal-900 text-white hover:bg-black px-8">
                     {editingUser ? 'Save Changes' : 'Create User'}
                  </Button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};
