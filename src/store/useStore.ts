import create from 'zustand';

interface AppState {
    user: { id: string; email: string } | null;
    setUser: (user: { id: string; email: string } | null) => void;
}

const useStore = create<AppState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
}));

export default useStore; 