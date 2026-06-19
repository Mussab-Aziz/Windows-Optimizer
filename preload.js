const { contextBridge, ipcRenderer } = require('electron');

// We are exposing a safe API to the Next.js frontend called 'window.systemAPI'
contextBridge.exposeInMainWorld('systemAPI', {
    // This function sends a message to the main Electron process
    applyTweak: (scriptName) => ipcRenderer.invoke('apply-tweak', scriptName),
    // Same as applyTweak, but passes an extra argument to the script
    applyTweakWithArgs: (scriptName, args) => ipcRenderer.invoke('apply-tweak-with-args', scriptName, args)
});
