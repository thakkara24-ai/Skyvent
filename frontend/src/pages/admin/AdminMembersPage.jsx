import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { Users, Search, Filter, Shield, Edit2, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton, EmptyState } from '../../components/common/UiHelpers';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminMembersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('MEMBER');

  const fetchUsers = async () => {
    try {
      const res = await authService.getUsers({ search, role: roleFilter || undefined });
      if (res.data) setUsers(res.data.results || res.data);
    } catch {
      toast.error('Failed to load members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(t);
  }, [search, roleFilter]);

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setNewRole(u.role);
    setEditUserModal(true);
  };

  const handleSaveRole = async () => {
    if (!selectedUser) return;
    try {
      await authService.updateUser(selectedUser.id, { role: newRole });
      toast.success(`Role updated for ${selectedUser.name}.`);
      setEditUserModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update role.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A1E18] tracking-tight">
            Student Member Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#7A6A5E] mt-1">
            Manage student registrations, departments, and administrative roles
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 rounded-xl border border-[#E8DCCE]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A6A5E]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, student ID, department..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg px-3 py-2 text-xs font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
        >
          <option value="">All Roles</option>
          <option value="MEMBER">Member</option>
          <option value="VOLUNTEER">Volunteer</option>
          <option value="TREASURER">Treasurer</option>
          <option value="PRESIDENT">President</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#7A6A5E]">
            No members found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF8F5] border-b border-[#E8DCCE] text-[#7A6A5E] font-semibold">
                <tr>
                  <th className="py-3 px-4">Student Name & Email</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Membership</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCCE]/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#FAF8F5]/80">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#2A1E18]">{u.name}</div>
                      <div className="text-[11px] text-[#7A6A5E]">{u.email}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[#2A1E18]">{u.student_id || '—'}</td>
                    <td className="py-3 px-4 text-[#7A6A5E]">{u.department || 'General'}</td>
                    <td className="py-3 px-4">
                      <Badge variant={u.role === 'SUPER_ADMIN' ? 'danger' : u.role === 'PRESIDENT' ? 'coffee' : u.role === 'TREASURER' ? 'clay' : u.role === 'VOLUNTEER' ? 'info' : 'default'} size="sm">
                        {u.role?.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {u.has_active_membership ? (
                        <Badge variant="success" size="sm">✓ Active</Badge>
                      ) : (
                        <span className="text-[11px] text-[#7A6A5E]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Edit2}
                        onClick={() => handleOpenEdit(u)}
                      >
                        Edit Role
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Edit Role Modal */}
      <Modal
        isOpen={editUserModal}
        onClose={() => setEditUserModal(false)}
        title="Update Member Role"
        subtitle={selectedUser?.name}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider mb-1.5">
              Select Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full bg-white border border-[#E8DCCE] rounded-lg px-3.5 py-2.5 text-sm font-semibold text-[#2A1E18] focus:border-[#6B4A38] focus:outline-none"
            >
              <option value="MEMBER">Member (Standard Access)</option>
              <option value="VOLUNTEER">Volunteer (Event Check-In & Tasks)</option>
              <option value="TREASURER">Treasurer (Finance & Claims Approval)</option>
              <option value="PRESIDENT">President (Events, Members, Tasks)</option>
              <option value="SUPER_ADMIN">Super Admin (Full System Access)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setEditUserModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveRole}>
              Save Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
