import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, ClinicalNote, RecordingSession, NoteTemplate } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, specialty: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setSubscriptionStatus: (status: 'active' | 'inactive' | 'trial') => void;
}

interface NotesState {
  notes: ClinicalNote[];
  currentNote: ClinicalNote | null;
  isLoading: boolean;
  addNote: (note: ClinicalNote) => void;
  updateNote: (id: string, updates: Partial<ClinicalNote>) => void;
  deleteNote: (id: string) => void;
  setCurrentNote: (note: ClinicalNote | null) => void;
  getNoteById: (id: string) => ClinicalNote | undefined;
}

interface RecordingState {
  session: RecordingSession;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
  setDuration: (duration: number) => void;
}

interface SettingsState {
  selectedTemplate: NoteTemplate;
  autoSave: boolean;
  darkMode: boolean;
  notifications: boolean;
  setTemplate: (template: NoteTemplate) => void;
  toggleAutoSave: () => void;
  toggleDarkMode: () => void;
  toggleNotifications: () => void;
}

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: async (email: string, _password: string) => {
        set({ isLoading: true });
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user: User = {
          id: '1',
          email,
          name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'User',
          role: email.includes('admin') ? 'admin' : 'clinician',
          specialty: 'General Medicine',
          subscriptionStatus: 'active',
          subscriptionPlan: 'practice',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        };
        
        set({ user, isAuthenticated: true, isLoading: false });
      },
      signup: async (email: string, _password: string, name: string, specialty: string) => {
        set({ isLoading: true });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user: User = {
          id: Date.now().toString(),
          email,
          name,
          role: email.includes('admin') ? 'admin' : 'clinician',
          specialty,
          subscriptionStatus: 'active',
          subscriptionPlan: 'practice',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        };
        
        set({ user, isAuthenticated: true, isLoading: false });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
        // Clear notes storage on logout for demo
        localStorage.removeItem('notes-storage');
      },
      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
      setSubscriptionStatus: (status) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, subscriptionStatus: status } });
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

// Notes Store
export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      currentNote: null,
      isLoading: false,
      addNote: (note) => {
        set((state) => ({ notes: [note, ...state.notes] }));
      },
      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, ...updates, updatedAt: new Date() } : note
          ),
          currentNote: state.currentNote?.id === id 
            ? { ...state.currentNote, ...updates, updatedAt: new Date() } 
            : state.currentNote,
        }));
      },
      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
          currentNote: state.currentNote?.id === id ? null : state.currentNote,
        }));
      },
      setCurrentNote: (note) => {
        set({ currentNote: note });
      },
      getNoteById: (id) => {
        return get().notes.find((note) => note.id === id);
      },
    }),
    {
      name: 'notes-storage',
    }
  )
);

// Recording Store
export const useRecordingStore = create<RecordingState>()((set, get) => ({
  session: {
    id: '',
    status: 'idle',
    duration: 0,
  },
  mediaRecorder: null,
  audioChunks: [],
  startRecording: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          set({ audioChunks: [...audioChunks] });
        }
      };
      
      mediaRecorder.start(1000);
      
      set({
        mediaRecorder,
        audioChunks: [],
        session: {
          id: Date.now().toString(),
          status: 'recording',
          startTime: new Date(),
          duration: 0,
        },
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  },
  stopRecording: async () => {
    const { mediaRecorder, audioChunks } = get();
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      return new Promise<Blob | null>((resolve) => {
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          
          set({
            session: {
              ...get().session,
              status: 'completed',
              audioBlob,
            },
            mediaRecorder: null,
          });
          
          resolve(audioBlob);
        };
        
        mediaRecorder.stop();
      });
    }
    return null;
  },
  pauseRecording: () => {
    const { mediaRecorder } = get();
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      set({ session: { ...get().session, status: 'paused' } });
    }
  },
  resumeRecording: () => {
    const { mediaRecorder } = get();
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      set({ session: { ...get().session, status: 'recording' } });
    }
  },
  resetRecording: () => {
    const { mediaRecorder } = get();
    if (mediaRecorder) {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    set({
      session: { id: '', status: 'idle', duration: 0 },
      mediaRecorder: null,
      audioChunks: [],
    });
  },
  setDuration: (duration) => {
    set({ session: { ...get().session, duration } });
  },
}));

// Settings Store
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      selectedTemplate: 'soap',
      autoSave: true,
      darkMode: false,
      notifications: true,
      setTemplate: (template) => set({ selectedTemplate: template }),
      toggleAutoSave: () => set((state) => ({ autoSave: !state.autoSave })),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleNotifications: () => set((state) => ({ notifications: !state.notifications })),
    }),
    {
      name: 'settings-storage',
    }
  )
);
