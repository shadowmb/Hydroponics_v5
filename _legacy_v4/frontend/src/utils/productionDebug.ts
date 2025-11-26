// TODO: IMPLEMENT_LATER - ще бъде адаптирано за реална система
export function exportSystemState() {
  return {
    version: '1.0.0',
    timestamp: Date.now(),
    systemState: 'mock-data' // TODO: IMPLEMENT_LATER - ще бъде заменено с реален state
  }
}

if (typeof window !== 'undefined') {
  (window as any).__prodDebug = {
    export: exportSystemState,
    ping: () => 'debug-ready'
  }
}
