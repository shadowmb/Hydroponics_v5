import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';

// Define the shape of the UI Context
// This can be expanded for other wizards or global states
export interface WizardConteXtData {
    active: boolean;
    step?: number;
    config?: any;
    name?: string; // 'FirmwareBuilder', 'DeviceWizard', etc.
    locale?: string; // 'bg', 'en' - for future i18n support
}

interface UIState {
    wizard: WizardConteXtData;
    currentPath: string;
}

interface UIStateContextType {
    uiState: UIState;
    setWizardState: (data: Partial<WizardConteXtData>) => void;
    clearWizardState: () => void;
    setCurrentPath: (path: string) => void;
}

const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

export function UIStateProvider({ children }: { children: ReactNode }) {
    const [uiState, setUiState] = useState<UIState>({
        wizard: { active: false },
        currentPath: window.location.pathname
    });

    const setWizardState = useCallback((data: Partial<WizardConteXtData>) => {
        setUiState(prev => {
            // Optimization: Prevent update if data hasn't effectively changed
            // Simple check for step or active status to avoid loop?
            // Deep check might be expensive, but basic check helps.
            if (prev.wizard.active === true && data.step === prev.wizard.step && JSON.stringify(data.config) === JSON.stringify(prev.wizard.config)) {
                return prev;
            }
            return {
                ...prev,
                wizard: { ...prev.wizard, active: true, ...data }
            };
        });
    }, []);

    const clearWizardState = useCallback(() => {
        setUiState(prev => ({
            ...prev,
            wizard: { active: false }
        }));
    }, []);

    const setCurrentPath = useCallback((path: string) => {
        setUiState(prev => {
            if (prev.currentPath === path) return prev;
            return { ...prev, currentPath: path };
        });
    }, []);

    // Optional: Listen to history changes if needed, but components can report path mostly.

    return (
        <UIStateContext.Provider value={{ uiState, setWizardState, clearWizardState, setCurrentPath }}>
            {children}
        </UIStateContext.Provider>
    );
}

export const useUIState = () => {
    const context = useContext(UIStateContext);
    if (context === undefined) {
        throw new Error('useUIState must be used within a UIStateProvider');
    }
    return context;
};
