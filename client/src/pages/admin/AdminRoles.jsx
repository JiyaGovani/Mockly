import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';

const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const BLANK_ROLE = { name: '', displayName: '', description: '', isActive: true };

// ─── Add Role Form ───
function AddRoleForm({ onSaved }) {
  const [form, setForm] = useState({ ...BLANK_ROLE });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.post('/admin/roles', { ...form, name: form.name.toUpperCase() });
      setForm({ ...BLANK_ROLE });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-stone-800">Add New Role</h3>
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="grid sm:grid-cols-4 gap-3">
        <input
          id="role-name"
          required
          type="text"
          placeholder="Name (e.g. SDE)"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-900/50 shadow-sm"
        />
        <input
          id="role-display-name"
          required
          type="text"
          placeholder="Display Name (e.g. Software Dev)"
          value={form.displayName}
          onChange={(e) => set('displayName', e.target.value)}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-900/50 shadow-sm"
        />
        <input
          id="role-description"
          type="text"
          placeholder="Description (optional)"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-900/50 shadow-sm"
        />
        <button
          id="btn-add-role"
          type="submit"
          disabled={saving}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-900 to-amber-700 text-white text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {saving ? 'Adding…' : '+ Add Role'}
        </button>
      </form>
    </div>
  );
}

// ─── Toggle Switch ───
function Toggle({ checked, onChange, id }) {
  return (
    <button
      id={id}
      onClick={onChange}
      className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
        checked ? 'bg-emerald-500' : 'bg-slate-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

// ─── Inline Edit Row ───
function RoleRow({ role, onUpdated, onDeleted }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: role.displayName, description: role.description });
  const [saving, setSaving] = useState(false);

  const handleToggleActive = async () => {
    try {
      await api.put(`/admin/roles/${role._id}`, { isActive: !role.isActive });
      onUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/roles/${role._id}`, form);
      setEditing(false);
      onUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/roles/${role._id}`);
      onDeleted();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <tr className="hover:bg-stone-100/50 transition-colors">
      <td className="px-5 py-3">
        <span className="font-mono text-sm font-semibold text-amber-900">{role.name}</span>
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input
            id={`role-edit-display-${role._id}`}
            type="text"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            className="px-2 py-1 rounded-lg bg-white border border-stone-200 text-sm text-stone-850 focus:outline-none focus:ring-1 focus:ring-amber-900/50 w-full"
          />
        ) : (
          <span className="text-sm text-stone-800">{role.displayName}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <input
            id={`role-edit-desc-${role._id}`}
            type="text"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="px-2 py-1 rounded-lg bg-white border border-stone-200 text-sm text-stone-855 focus:outline-none focus:ring-1 focus:ring-amber-900/50 w-full"
          />
        ) : (
          <span className="text-sm text-stone-600">{role.description || '—'}</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Toggle
          id={`toggle-role-${role._id}`}
          checked={role.isActive}
          onChange={handleToggleActive}
        />
      </td>
      <td className="px-5 py-3 text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-2">
            <button
              id={`btn-cancel-role-${role._id}`}
              onClick={() => { setEditing(false); setForm({ displayName: role.displayName, description: role.description }); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 transition-all"
            >
              Cancel
            </button>
            <button
              id={`btn-save-role-${role._id}`}
              disabled={saving}
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-900 text-white hover:bg-amber-800 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <button
              id={`btn-edit-role-${role._id}`}
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-stone-500 hover:text-amber-950 hover:bg-amber-900/10 transition-all"
              title="Edit"
            >
              ✏️
            </button>
            <button
              id={`btn-delete-role-${role._id}`}
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-stone-500 hover:text-red-650 hover:bg-red-500/10 transition-all"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

// ─── Main Page ───
export default function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/roles');
      setRoles(data.roles);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  return (
    <AdminLayout>
      <div className="px-8 py-8 space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Roles</h1>
          <p className="text-sm text-stone-600 mt-1">
            Manage target roles available in the platform
          </p>
        </div>

        {error && (
          <div className="glass-card p-4 border border-red-500/20 bg-red-500/5">
            <p className="text-sm text-red-400">⚠ {error}</p>
          </div>
        )}

        {/* Add Role Form */}
        <AddRoleForm onSaved={loadRoles} />

        {/* Roles Table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs text-stone-500 uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Display Name</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Active</th>
                <th className="text-right px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-150">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-stone-150 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : roles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-stone-550">
                    No roles found. Add one above.
                  </td>
                </tr>
              ) : (
                roles.map((role) => (
                  <RoleRow
                    key={role._id}
                    role={role}
                    onUpdated={loadRoles}
                    onDeleted={loadRoles}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
