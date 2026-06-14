'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { UserIDChip } from '@/components/ui/UserIDChip';
import { toast } from 'sonner';

const queryClient = new QueryClient();

interface User {
  id: string;
  userId: string;
  name: string;
  role: string;
  domainScope: string[];
  isActive: boolean;
}

function UsersContent() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', role: 'EDITOR', password: 'CoSora2024!' });
  const [createdId, setCreatedId] = useState<string | null>(null);

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data as User[];
    },
  });

  const createUser = async () => {
    try {
      const res = await api.post('/auth/register', {
        ...newUser,
        domainScope: ['CONTRACT_MANAGEMENT'],
      });
      setCreatedId(res.data.userId);
      toast.success('User created');
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
    } catch {
      toast.error('Failed to create user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="cosora-section-header flex-1">User Management</div>
        <button onClick={() => setShowCreate(true)} className="cosora-btn-primary text-sm ml-4">
          Create User
        </button>
      </div>

      {createdId && (
        <div className="cosora-card p-4 border-cosora-success">
          <p className="text-cosora-success text-sm">User created successfully!</p>
          <p className="text-cosora-light mt-2">
            User ID: <UserIDChip userId={createdId} />
          </p>
        </div>
      )}

      {showCreate && (
        <div className="cosora-card p-4 space-y-3">
          <h3 className="text-cosora-light font-medium">Create New User</h3>
          <input
            placeholder="Name"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            className="cosora-input"
          />
          <select
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            className="cosora-input"
          >
            <option value="ADMIN">Admin</option>
            <option value="EDITOR">Editor</option>
            <option value="REVIEWER">Reviewer</option>
          </select>
          <div className="flex gap-2">
            <button onClick={createUser} className="cosora-btn-primary text-sm">Create</button>
            <button onClick={() => setShowCreate(false)} className="text-cosora-mid text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="cosora-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cosora-orange/10 text-cosora-orange text-xs">
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">User ID</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Domains</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-cosora-smoke hover:bg-cosora-smoke/20">
                <td className="px-4 py-3 text-cosora-light">{user.name}</td>
                <td className="px-4 py-3"><UserIDChip userId={user.userId} /></td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-cosora-orange/20 text-cosora-orange px-2 py-0.5 rounded">
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-cosora-mid text-xs max-w-[200px] truncate">
                  {user.domainScope.slice(0, 2).map((d) => d.replace(/_/g, ' ')).join(', ')}
                  {user.domainScope.length > 2 && ` +${user.domainScope.length - 2}`}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${user.isActive ? 'text-cosora-success' : 'text-cosora-danger'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cosora-card p-4 bg-cosora-amber-bg border-l-4 border-cosora-orange">
        <p className="text-cosora-light text-sm">
          Role changes require approval from <strong>ALL</strong> active Admin users before taking effect.
        </p>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <UsersContent />
    </QueryClientProvider>
  );
}
