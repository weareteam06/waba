import { create } from "zustand";

type UiState = {
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  notificationsOpen: boolean;
  contextOpen: boolean;
  routeLoading: boolean;
  setSidebarCollapsed: (value: boolean) => void;
  setCommandOpen: (value: boolean) => void;
  setNotificationsOpen: (value: boolean) => void;
  setContextOpen: (value: boolean) => void;
  setRouteLoading: (value: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  commandOpen: false,
  notificationsOpen: false,
  contextOpen: true,
  routeLoading: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setCommandOpen: (commandOpen) => set({ commandOpen }),
  setNotificationsOpen: (notificationsOpen) => set({ notificationsOpen }),
  setContextOpen: (contextOpen) => set({ contextOpen }),
  setRouteLoading: (routeLoading) => set({ routeLoading }),
}));
