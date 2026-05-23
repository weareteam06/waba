import { create } from "zustand";
import type { PreviewDevice, PreviewTheme, TemplateCategory, TemplateStatus } from "./types";

type TemplateWorkspaceState = {
  search: string;
  category: TemplateCategory | "All";
  status: TemplateStatus | "All";
  selectedId: string;
  previewDevice: PreviewDevice;
  previewTheme: PreviewTheme;
  rightPanelOpen: boolean;
  setSearch: (search: string) => void;
  setCategory: (category: TemplateCategory | "All") => void;
  setStatus: (status: TemplateStatus | "All") => void;
  setSelectedId: (selectedId: string) => void;
  setPreviewDevice: (previewDevice: PreviewDevice) => void;
  setPreviewTheme: (previewTheme: PreviewTheme) => void;
  setRightPanelOpen: (rightPanelOpen: boolean) => void;
};

export const useTemplateWorkspaceStore = create<TemplateWorkspaceState>((set) => ({
  search: "",
  category: "All",
  status: "All",
  selectedId: "renewal-reminder",
  previewDevice: "iphone",
  previewTheme: "dark",
  rightPanelOpen: true,
  setSearch: (search) => set({ search }),
  setCategory: (category) => set({ category }),
  setStatus: (status) => set({ status }),
  setSelectedId: (selectedId) => set({ selectedId }),
  setPreviewDevice: (previewDevice) => set({ previewDevice }),
  setPreviewTheme: (previewTheme) => set({ previewTheme }),
  setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
}));
