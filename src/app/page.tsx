'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Users, Plus, Pencil, Trash2, X, Gamepad2,
  Phone, User, Star, Hash, Clock, Search, RefreshCw, Zap
} from 'lucide-react';

interface Participant {
  id: number;
  name: string;
  phone: string;
  score: number;
  created_at: string;
}

type TabView = 'leaderboard' | 'manage';

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activeTab, setActiveTab] = useState<TabView>('leaderboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formScore, setFormScore] = useState('');

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/participants');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setParticipants(Array.isArray(data) ? data : []);
    } catch {
      showToast('Failed to load participants', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth');
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipants();
    checkAuth();
  }, [fetchParticipants, checkAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        showToast('Logged in successfully', 'success');
        setLoginUsername('');
        setLoginPassword('');
      } else {
        showToast('Invalid credentials', 'error');
      }
    } catch {
      showToast('Login failed', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      setIsAuthenticated(false);
      showToast('Logged out successfully', 'success');
    } catch {
      showToast('Logout failed', 'error');
    }
  };

  const handleAdd = async () => {
    if (!formName.trim() || !formPhone.trim() || !formScore.trim()) {
      showToast('Please fill all fields', 'error');
      return;
    }

    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          phone: formPhone.trim(),
          score: parseInt(formScore, 10),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add participant');
      }

      showToast(`${formName} added successfully!`, 'success');
      setShowAddModal(false);
      resetForm();
      fetchParticipants();
    } catch (error: any) {
      showToast(error.message || 'Failed to add participant', 'error');
    }
  };

  const handleEdit = async () => {
    if (!editingParticipant || !formName.trim() || !formPhone.trim() || !formScore.trim()) {
      showToast('Please fill all fields', 'error');
      return;
    }

    try {
      const res = await fetch(`/api/participants/${editingParticipant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          phone: formPhone.trim(),
          score: parseInt(formScore, 10),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update participant');
      }

      showToast(`${formName} updated successfully!`, 'success');
      setEditingParticipant(null);
      resetForm();
      fetchParticipants();
    } catch (error: any) {
      showToast(error.message || 'Failed to update participant', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/participants/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');

      showToast('Participant removed', 'success');
      setDeleteConfirm(null);
      fetchParticipants();
    } catch {
      showToast('Failed to delete participant', 'error');
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormPhone('');
    setFormScore('');
  };

  const openEditModal = (p: Participant) => {
    setEditingParticipant(p);
    setFormName(p.name);
    setFormPhone(p.phone);
    setFormScore(p.score.toString());
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingParticipant(null);
    setDeleteConfirm(null);
    resetForm();
  };

  const filteredParticipants = participants.filter(
    p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  );

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    return 'rank-default';
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const totalPlayers = participants.length;
  const highestScore = participants.length > 0 ? participants[0]?.score : 0;
  const avgScore = participants.length > 0
    ? Math.round(participants.reduce((s, p) => s + p.score, 0) / participants.length)
    : 0;

  return (
    <div className="relative z-10 min-h-screen flex flex-col">
      {/* ─── HEADER ─── */}
      <header className="relative px-6 pt-10 pb-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Gamepad2 className="w-8 h-8" style={{ color: 'var(--accent-cyan)' }} />
          <h1
            className="font-arcade text-3xl md:text-5xl font-black tracking-widest"
            style={{
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple), var(--accent-pink))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            TURING ARENA
          </h1>
          <Zap className="w-8 h-8" style={{ color: 'var(--accent-purple)' }} />
        </div>
        <p
          className="font-arcade text-xs md:text-sm tracking-[0.3em] uppercase"
          style={{ color: 'var(--accent-cyan)', opacity: 0.7 }}
        >
          RL Arcade — Compete Against AI
        </p>
      </header>

      {/* ─── STATS BAR ─── */}
      <div className="max-w-5xl mx-auto w-full px-4 mb-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="stat-card">
            <Users className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--accent-cyan)' }} />
            <div className="font-arcade text-2xl font-bold" style={{ color: 'var(--accent-cyan)' }}>
              {totalPlayers}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Players</div>
          </div>
          <div className="stat-card">
            <Trophy className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--accent-gold)' }} />
            <div className="font-arcade text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
              {highestScore}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Top Score</div>
          </div>
          <div className="stat-card">
            <Star className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--accent-purple)' }} />
            <div className="font-arcade text-2xl font-bold" style={{ color: 'var(--accent-purple)' }}>
              {avgScore}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Avg Score</div>
          </div>
        </div>
      </div>

      {/* ─── NAVIGATION ─── */}
      <div className="max-w-5xl mx-auto w-full px-4 mb-6">
        <div className="flex items-center justify-center gap-2 card-glow p-1" style={{ borderRadius: '14px' }}>
          <button
            className={`nav-tab ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <Trophy className="w-4 h-4 inline-block mr-2 -mt-0.5" />
            Leaderboard
          </button>
          <button
            className={`nav-tab ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <Users className="w-4 h-4 inline-block mr-2 -mt-0.5" />
            Manage Players
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <main className="max-w-5xl mx-auto w-full px-4 pb-12 flex-1">

        {/* ═══ LEADERBOARD TAB ═══ */}
        {activeTab === 'leaderboard' && (
          <div className="card-glow p-0 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h2 className="font-arcade text-lg font-bold flex items-center gap-2" style={{ color: 'var(--accent-gold)' }}>
                <Trophy className="w-5 h-5" />
                Live Leaderboard
              </h2>
              <button className="btn-neon btn-neon-cyan flex items-center gap-2" onClick={fetchParticipants}>
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>

            {loading ? (
              <div className="empty-state">
                <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" style={{ color: 'var(--accent-cyan)' }} />
                <p>Loading scores...</p>
              </div>
            ) : participants.length === 0 ? (
              <div className="empty-state">
                <Gamepad2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                <p className="text-lg mb-1">No players yet</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Add participants from the Manage Players tab
                </p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                    <th className="table-header" style={{ width: '12%', textAlign: 'center' }}>Rank</th>
                    <th className="table-header" style={{ width: '38%', textAlign: 'left' }}>Player</th>
                    <th className="table-header" style={{ width: '28%', textAlign: 'left' }}>Phone</th>
                    <th className="table-header" style={{ width: '22%', textAlign: 'right' }}>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p, idx) => {
                    const rank = idx + 1;
                    return (
                      <tr
                        key={p.id}
                        className="leaderboard-row table-row"
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <td style={{ padding: '16px 20px', textAlign: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.05)' }}>
                          <span
                            className={`inline-flex items-center justify-center font-arcade ${getRankBadgeClass(rank)}`}
                            style={{ width: 36, height: 36, borderRadius: '50%', fontSize: 14 }}
                          >
                            {rank <= 3 ? getRankEmoji(rank) : rank}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 500, borderBottom: '1px solid rgba(0, 240, 255, 0.05)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <User className="w-4 h-4" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            {p.name}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: 14, borderBottom: '1px solid rgba(0, 240, 255, 0.05)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <Phone className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            {p.phone}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right', borderBottom: '1px solid rgba(0, 240, 255, 0.05)' }}>
                          <span
                            className={`font-arcade ${rank <= 3 ? 'score-glow' : ''}`}
                            style={{ fontSize: 18, fontWeight: 700, color: rank === 1 ? 'var(--accent-gold)' : 'var(--accent-cyan)' }}
                          >
                            {p.score.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ═══ MANAGE TAB ═══ */}
        {activeTab === 'manage' && (
          <div>
            {!isAuthenticated ? (
              <div className="card-glow max-w-md mx-auto mt-8 p-8" style={{ animation: 'glow-pulse 3s infinite' }}>
                <div className="text-center mb-8">
                  <User className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--accent-purple)' }} />
                  <h2 className="font-arcade text-xl font-bold mb-2" style={{ color: 'var(--accent-purple)' }}>Admin Login</h2>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Authenticate to manage players</p>
                </div>
                {isCheckingAuth ? (
                  <div className="text-center py-4">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin" style={{ color: 'var(--accent-cyan)' }} />
                  </div>
                ) : (
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        Username
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          className="input-arcade pl-10"
                          placeholder="Enter admin username"
                          value={loginUsername}
                          onChange={(e) => setLoginUsername(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                        Password
                      </label>
                      <div className="relative">
                        <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <input
                          type="password"
                          className="input-arcade pl-10"
                          placeholder="Enter admin password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="btn-neon btn-neon-purple w-full mt-4 flex justify-center items-center gap-2"
                      disabled={loginLoading}
                    >
                      {loginLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Access Database'}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <>
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="input-arcade pl-11"
                      placeholder="Search by name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button className="btn-neon btn-neon-red flex items-center justify-center gap-2" onClick={handleLogout} title="Logout">
                      <X className="w-4 h-4" />
                    </button>
                    <button className="btn-neon btn-neon-green flex items-center justify-center gap-2" onClick={() => setShowAddModal(true)}>
                      <Plus className="w-4 h-4" /> Add Player
                    </button>
                  </div>
                </div>

                {/* Players table */}
                <div className="card-glow p-0 overflow-hidden">
                  <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <h2 className="font-arcade text-sm font-bold" style={{ color: 'var(--accent-purple)' }}>
                      <Users className="w-4 h-4 inline-block mr-2 -mt-0.5" />
                      All Players ({filteredParticipants.length})
                    </h2>
                  </div>

              {filteredParticipants.length === 0 ? (
                <div className="empty-state">
                  <Users className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  <p className="text-lg mb-1">
                    {searchQuery ? 'No matching players' : 'No players yet'}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {searchQuery ? 'Try a different search' : 'Click "Add Player" to get started'}
                  </p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <th className="table-header" style={{ width: '8%', textAlign: 'center' }}>#</th>
                      <th className="table-header" style={{ width: '25%', textAlign: 'left' }}>Name</th>
                      <th className="table-header" style={{ width: '25%', textAlign: 'left' }}>Phone</th>
                      <th className="table-header" style={{ width: '15%', textAlign: 'left' }}>Score</th>
                      <th className="table-header" style={{ width: '12%', textAlign: 'left' }}>Time</th>
                      <th className="table-header" style={{ width: '15%', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredParticipants.map((p, idx) => (
                      <tr key={p.id} className="table-row">
                        <td style={{ padding: '14px 20px', textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', borderBottom: '1px solid rgba(0, 240, 255, 0.05)' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '14px 20px', fontWeight: 500, fontSize: 14, borderBottom: '1px solid rgba(0, 240, 255, 0.05)' }}>
                          {p.name}
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 14, color: 'var(--text-secondary)', borderBottom: '1px solid rgba(0, 240, 255, 0.05)' }}>
                          {p.phone}
                        </td>
                        <td style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0, 240, 255, 0.05)' }}>
                          <span className="font-arcade" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-cyan)' }}>
                            {p.score.toLocaleString()}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid rgba(0, 240, 255, 0.05)' }}>
                          {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'center', borderBottom: '1px solid rgba(0, 240, 255, 0.05)' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            <button
                              className="btn-neon btn-neon-purple"
                              style={{ padding: 8, borderRadius: 8 }}
                              onClick={() => openEditModal(p)}
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              className="btn-neon btn-neon-red"
                              style={{ padding: 8, borderRadius: 8 }}
                              onClick={() => setDeleteConfirm(p.id)}
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              </div>
            </>
            )}
          </div>
        )}
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="text-center py-6 px-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <p className="font-arcade text-xs" style={{ color: 'var(--text-muted)' }}>
          Turing Arena — RL Arcade &bull; 9 AM – 5 PM &bull; Mingos &amp; Quadrangle
        </p>
      </footer>

      {/* ─── ADD MODAL ─── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 transition"
              onClick={closeModal}
            >
              <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </button>
            <h3 className="font-arcade text-lg font-bold mb-6" style={{ color: 'var(--accent-green, #22c55e)' }}>
              <Plus className="w-5 h-5 inline-block mr-2 -mt-1" />
              Add Player
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Player Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-arcade pl-10"
                    placeholder="Enter player name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    className="input-arcade pl-10"
                    placeholder="Enter phone number"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Score
                </label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    className="input-arcade pl-10"
                    placeholder="Enter final score"
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button className="btn-neon btn-neon-cyan flex-1" onClick={closeModal}>Cancel</button>
              <button className="btn-neon btn-neon-green flex-1" onClick={handleAdd}>Add Player</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT MODAL ─── */}
      {editingParticipant && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 transition"
              onClick={closeModal}
            >
              <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
            </button>
            <h3 className="font-arcade text-lg font-bold mb-6" style={{ color: 'var(--accent-purple)' }}>
              <Pencil className="w-5 h-5 inline-block mr-2 -mt-1" />
              Edit Player
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Player Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="input-arcade pl-10"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="tel"
                    className="input-arcade pl-10"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  Score
                </label>
                <div className="relative">
                  <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    type="number"
                    className="input-arcade pl-10"
                    value={formScore}
                    onChange={(e) => setFormScore(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button className="btn-neon btn-neon-cyan flex-1" onClick={closeModal}>Cancel</button>
              <button className="btn-neon btn-neon-purple flex-1" onClick={handleEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM ─── */}
      {deleteConfirm !== null && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content text-center" onClick={(e) => e.stopPropagation()}>
            <Trash2 className="w-12 h-12 mx-auto mb-4" style={{ color: '#ef4444' }} />
            <h3 className="font-arcade text-lg font-bold mb-2" style={{ color: '#ef4444' }}>
              Remove Player?
            </h3>
            <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
              This will permanently delete <strong>{participants.find(p => p.id === deleteConfirm)?.name}</strong> and their score from the leaderboard.
            </p>
            <div className="flex gap-3">
              <button className="btn-neon btn-neon-cyan flex-1" onClick={closeModal}>Cancel</button>
              <button className="btn-neon btn-neon-red flex-1" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TOAST ─── */}
      {toast && (
        <div className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
