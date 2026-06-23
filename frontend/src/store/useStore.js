import { create } from 'zustand';
import api from '../lib/api';

const useStore = create((set, get) => ({
  // ─── AUTH ─────────────────────────────────────────────────────────
  user: null,
  token: localStorage.getItem('scribe_token') || null,
  authLoading: false,

  login: async (email, password) => {
    set({ authLoading: true });
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('scribe_token', data.token);
    set({ user: data.user, token: data.token, authLoading: false });
    return data;
  },

  register: async (name, email, password) => {
    set({ authLoading: true });
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('scribe_token', data.token);
    set({ user: data.user, token: data.token, authLoading: false });
    return data;
  },

  logout: () => {
    localStorage.removeItem('scribe_token');
    set({ user: null, token: null, voiceProfile: null, manuscripts: [] });
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user });
      return data.user;
    } catch { return null; }
  },

  updateProfile: async (updates) => {
    const { data } = await api.put('/auth/profile', updates);
    set({ user: data.user });
    return data.user;
  },

  // ─── VOICE PROFILE ────────────────────────────────────────────────
  voiceProfile: null,

  fetchVoiceProfile: async () => {
    try {
      const { data } = await api.get('/voice/profile');
      set({ voiceProfile: data.profile });
      return data.profile;
    } catch { return null; }
  },

  saveVoiceInterview: async (answers) => {
    const { data } = await api.post('/voice/interview', answers);
    set({ voiceProfile: data.profile });
    return data.profile;
  },

  updateVoiceProfile: async (updates) => {
    const { data } = await api.put('/voice/profile', updates);
    set({ voiceProfile: data.profile });
    return data.profile;
  },

  // ─── MANUSCRIPTS ──────────────────────────────────────────────────
  manuscripts: [],
  activeManuscript: null,
  activeChapters: [],
  manuscriptsLoading: false,

  fetchManuscripts: async () => {
    set({ manuscriptsLoading: true });
    try {
      const { data } = await api.get('/manuscripts');
      set({ manuscripts: data.manuscripts, manuscriptsLoading: false });
      return data.manuscripts;
    } catch (e) {
      set({ manuscriptsLoading: false });
      return [];
    }
  },

  fetchManuscript: async (id) => {
    const { data } = await api.get(`/manuscripts/${id}`);
    set({ activeManuscript: data.manuscript, activeChapters: data.chapters });
    return data;
  },

  createManuscript: async (payload) => {
    const { data } = await api.post('/manuscripts', payload);
    set(s => ({ manuscripts: [data.manuscript, ...s.manuscripts] }));
    return data.manuscript;
  },

  updateManuscript: async (id, updates) => {
    const { data } = await api.put(`/manuscripts/${id}`, updates);
    set(s => ({
      manuscripts: s.manuscripts.map(m => m.id === id ? { ...m, ...data.manuscript } : m),
      activeManuscript: s.activeManuscript?.id === id ? { ...s.activeManuscript, ...data.manuscript } : s.activeManuscript,
    }));
    return data.manuscript;
  },

  deleteManuscript: async (id) => {
    await api.delete(`/manuscripts/${id}`);
    set(s => ({ manuscripts: s.manuscripts.filter(m => m.id !== id) }));
  },

  updateChapter: async (manuscriptId, chapterId, updates) => {
    const { data } = await api.put(`/manuscripts/${manuscriptId}/chapters/${chapterId}`, updates);
    set(s => ({
      activeChapters: s.activeChapters.map(ch => ch.id === chapterId ? data.chapter : ch),
    }));
    return data.chapter;
  },

  exportManuscript: async (manuscriptId, title) => {
    const response = await api.get(`/manuscripts/${manuscriptId}/export`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const filename = (title || 'manuscript').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    link.setAttribute('download', `${filename}.txt`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  setActiveManuscript: (manuscript) => set({ activeManuscript: manuscript }),
  setActiveChapters: (chapters) => set({ activeChapters: chapters }),

  reorderChapters: async (manuscriptId, orderedIds) => {
    // Optimistic reorder in UI
    set(s => {
      const map = new Map(s.activeChapters.map(c => [c.id, c]));
      const reordered = orderedIds.map((id, i) => ({ ...map.get(id), chapter_number: map.get(id)?.chapter_number === 0 ? 0 : i + 1 }));
      return { activeChapters: reordered };
    });
    try {
      const { data } = await api.put(`/manuscripts/${manuscriptId}/chapters/reorder`, { orderedIds });
      set({ activeChapters: data.chapters });
      return data.chapters;
    } catch (e) {
      return null;
    }
  },

  generateOutlineForManuscript: async (manuscriptId) => {
    const { data } = await api.post(`/manuscripts/${manuscriptId}/generate-outline`);
    set({ activeChapters: data.chapters });
    return data.chapters;
  },

  // ─── TOASTS ───────────────────────────────────────────────────────
  toasts: [],
  showToast: (message, type = 'success') => {
    const id = Date.now() + Math.random();
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, 3500);
  },
  dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  // ─── THEME ────────────────────────────────────────────────────────
  theme: localStorage.getItem('scribe_theme') || 'dark',
  toggleTheme: () => set(s => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('scribe_theme', next);
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),
}));

export default useStore;
