export {};

declare global {
  interface Window {
    systemAPI: {
      applyTweak: (scriptName: string) => Promise<{ success: boolean; message: string }>;
      applyTweakWithArgs: (scriptName: string, args: string) => Promise<{ success: boolean; message: string }>;
    };
  }
}
