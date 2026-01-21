import { useEffect } from 'react';
import { useStore } from '../core/useStore';
import { socketService } from '../core/SocketService';
import { activeProgramService } from '../services/activeProgramService';

/**
 * Headless hook that synchronizes the Active Program state with the Zustand store.
 * This hook should be called once at the application root (e.g., in Layout.tsx).
 * 
 * It:
 * - Fetches the active program on mount
 * - Listens to socket events and updates the store
 * - Cleans up listeners on unmount
 */
export const useActiveProgramSync = () => {
    useEffect(() => {
        const setActiveProgram = useStore.getState().setActiveProgram;

        // Initial fetch
        const fetchProgram = async () => {
            try {
                const program = await activeProgramService.getActive();
                setActiveProgram(program);
            } catch (error) {
                console.error('[useActiveProgramSync] Failed to fetch active program:', error);
                setActiveProgram(null);
            }
        };

        fetchProgram();

        // Socket event handlers
        const handleProgramUpdated = (updated: any) => {
            if (updated && typeof updated === 'object') {
                setActiveProgram(updated);
            } else {
                // Fallback: re-fetch if payload is incomplete
                fetchProgram();
            }
        };

        const handleProgramStopped = () => {
            setActiveProgram(null);
        };

        const handleRefresh = () => {
            fetchProgram();
        };

        // Register listeners
        socketService.on('active:program_updated', handleProgramUpdated);
        socketService.on('program:paused', handleRefresh);
        socketService.on('program:resumed', handleRefresh);
        socketService.on('active:program_started', handleRefresh);
        socketService.on('active:program_stopped', handleProgramStopped);

        // Cleanup
        return () => {
            socketService.off('active:program_updated', handleProgramUpdated);
            socketService.off('program:paused', handleRefresh);
            socketService.off('program:resumed', handleRefresh);
            socketService.off('active:program_started', handleRefresh);
            socketService.off('active:program_stopped', handleProgramStopped);
        };
    }, []);
};
