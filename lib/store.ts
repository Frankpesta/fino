import { create } from "zustand";

/**
 * Ephemeral UI state only -- sidebar/modal/wizard-step state that has no
 * business being persisted or realtime-synced. All server state (balances,
 * deposits, plans, ...) comes from Convex's `useQuery` directly; never mirror
 * it into this store, or the two will drift out of sync.
 * See docs/02-phase-1-foundations.md 1.5.
 */
interface UiState {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  activeDashboardTab: string;
  setActiveDashboardTab: (tab: string) => void;

  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;

  depositWizardStep: number;
  setDepositWizardStep: (step: number) => void;
  resetDepositWizard: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  activeDashboardTab: "overview",
  setActiveDashboardTab: (tab) => set({ activeDashboardTab: tab }),

  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),

  depositWizardStep: 0,
  setDepositWizardStep: (step) => set({ depositWizardStep: step }),
  resetDepositWizard: () => set({ depositWizardStep: 0 }),
}));
