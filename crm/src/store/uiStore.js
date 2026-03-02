import { create } from 'zustand';

export const useUiStore = create((set) => ({
    sidebarOpen: true,
    rightPanelOpen: true,
    activeModal: null, // null | 'createBooking' | 'editAgent' | 'cannedResponse'
    modalData: null,
    notifications: [],

    toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),

    openModal: (modal, data = null) => set({ activeModal: modal, modalData: data }),
    closeModal: () => set({ activeModal: null, modalData: null }),

    addNotification: (notification) =>
        set((s) => ({
            notifications: [
                { id: Date.now(), ...notification },
                ...s.notifications.slice(0, 49),
            ],
        })),
    clearNotifications: () => set({ notifications: [] }),
}));
