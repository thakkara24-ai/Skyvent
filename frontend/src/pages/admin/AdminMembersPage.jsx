import React, { useState, useEffect } from 'react';
import { authService, extractDataArray } from '../../services/api';
import { Search, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Skeleton } from '../../components/common/UiHelpers';
import { toast } from 'sonner';

export const AdminMembersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  // Edit Role state
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState('MEMBER');
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Delete Member state
  const [deleteUserModal, setDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await authService.getUsers({ search, role: roleFilter || undefined });
      const items = extractDataArray(res);
      setUsers(items);
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
    setIsSavingRole(true);
    try {
      await authService.updateUser(selectedUser.id, { role: newRole });
      toast.success(`Role updated for ${selectedUser.name}.`);
      setEditUserModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to update role.');
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleOpenDelete = (u) => {
    setUserToDelete(u);
    setDeleteUserModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await authService.deleteUser(userToDelete.id);
      toast.success(`Member "${userToDelete.name}" was successfully deleted.`);
      setDeleteUserModal(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.message || 'Failed to delete member.');
    } finally {
      setIsDeleting(false);
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
            Manage student registrations, departments, roles, and memberships
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
          <option value="MERCHANDISE">Merchandise Manager</option>
          <option value="TREASURER">Treasurer</option>
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
                  <th className="py-3 px-4 text-right">Actions</th>
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
                      <Badge variant={u.role === 'SUPER_ADMIN' ? 'danger' : u.role === 'MERCHANDISE' ? 'coffee' : u.role === 'TREASURER' ? 'clay' : u.role === 'VOLUNTEER' ? 'info' : 'default'} size="sm">
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
                      {u.role === 'SUPER_ADMIN' ? (
                        <span className="text-[11px] font-semibold text-[#7A6A5E] italic">
                          Permanent Admin
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={Edit2}
                            onClick={() => handleOpenEdit(u)}
                            title="Edit user role"
                          >
                            Edit Role
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            className="bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 border border-rose-200"
                            icon={Trash2}
                            onClick={() => handleOpenDelete(u)}
                            title="Delete member"
                          >
                            Delete
                          </Button>
                        </div>
                      )}
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
              <option value="MERCHANDISE">Merchandise Manager (Products & Orders)</option>
              <option value="TREASURER">Treasurer (Finance, Fundraisers & Reports)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button variant="ghost" size="sm" onClick={() => setEditUserModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSavingRole} onClick={handleSaveRole}>
              Save Role
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Member Confirmation Modal */}
      <Modal
        isOpen={deleteUserModal}
        onClose={() => !isDeleting && setDeleteUserModal(false)}
        title="Delete Member Account"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-900">Are you sure you want to delete this member?</p>
              <p className="mt-1 text-rose-700 leading-relaxed">
                This action is permanent and cannot be undone. All tickets, orders, and membership passes associated with this user will also be removed.
              </p>
            </div>
          </div>

          {userToDelete && (
            <div className="bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg p-3 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#7A6A5E]">Name:</span>
                <span className="font-bold text-[#2A1E18]">{userToDelete.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7A6A5E]">Email:</span>
                <span className="font-mono text-[#2A1E18]">{userToDelete.email}</span>
              </div>
              {userToDelete.student_id && (
                <div className="flex justify-between">
                  <span className="text-[#7A6A5E]">Student ID:</span>
                  <span className="font-mono text-[#2A1E18]">{userToDelete.student_id}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#7A6A5E]">Role:</span>
                <span className="font-semibold text-[#6B4A38]">{userToDelete.role}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E8DCCE]">
            <Button
              variant="ghost"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteUserModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              isLoading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
