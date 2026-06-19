export {};

declare global {
  interface Window {
    systemAPI: {
      applyTweak: (scriptName: string) => Promise<{ success: boolean; message: string }>;
      applyTweakWithArgs: (scriptName: string, args: string) => Promise<{ success: boolean; message: string }>;
      getSystemStats: () => Promise<{
        cpuSpeedMHz: number;
        cpuModel: string;
        cpuCount: number;
        cpuUsage: number;
        totalRamGB: string;
        usedRamGB: string;
        freeRamGB: string;
        ramUsedPct: number;
      }>;
    };
  }
}
