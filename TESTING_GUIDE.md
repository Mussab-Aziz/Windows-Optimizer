# Testing Guide for Windows Optimizer

## Setup & Launch

### Step 1: Terminal 1 - Start Frontend Dev Server
```powershell
cd E:\Windows-Optimizer\frontend
npm run dev
```
Expected: `✓ Ready in XXXms` on http://localhost:3000

### Step 2: Terminal 2 - Start Electron App
```powershell
cd E:\Windows-Optimizer
npm start
```
Expected: Electron window opens with DevTools panel

---

## Testing Button Functionality

### What Should Happen When You Click a Button:

1. **Frontend (Browser Console):**
   ```
   [Frontend] Button clicked: telemetry -> registry_tweaker.py
   [Frontend] Sending tweak request: registry_tweaker.py
   ```

2. **Electron Main Process (Terminal):**
   ```
   [Bridge] Requesting Native Admin rights for: registry_tweaker.py...
   [Bridge] Script path: E:\Windows-Optimizer\backend\registry_tweaker.py
   [Bridge] Python: C:\Users\massa\AppData\Local\Programs\Python\Python313\python.exe
   [Bridge] Executing: powershell.exe -NoProfile -Command "Start-Process -FilePath '...' -Verb RunAs -Wait"
   ```

3. **UAC Prompt:** A Windows UAC dialog appears asking for admin permission

4. **Result:**
   - If approved: `[Bridge] Execution successful.` + UI button turns green
   - If denied: `[Bridge Error] UAC Denied or script failed` + UI stays red

---

## Debugging Checklist

### ✅ Bridge Connection
- [ ] DevTools opens when app starts (proves preload.js is loaded)
- [ ] Browser console shows `[Frontend] Bridge detected: window.systemAPI is available`
- [ ] Status text shows "Connected - Python Engine Ready" (green)

### ✅ Button Click
- [ ] Button changes to loading state (shows "..." or "Applying...")
- [ ] Browser console logs button click
- [ ] Terminal shows bridge requesting admin rights

### ✅ Python Execution
- [ ] UAC prompt appears
- [ ] Approving UAC shows success in terminal logs
- [ ] Denying UAC shows error in terminal logs

---

## Common Issues & Solutions

### Issue: "Bridge Not Found" status
**Solution:** 
- Check that Electron launched correctly
- Verify DevTools is visible (proves preload injection worked)
- Check browser console for errors

### Issue: Button click does nothing
**Solution:**
- Open DevTools (usually F12)
- Check Console tab for `[Frontend]` logs
- If no logs: bridge is not connected
- If logs appear but nothing happens: check Electron terminal for bridge logs

### Issue: UAC prompt never appears
**Solution:**
- Check Electron terminal for `[Bridge] Executing:` log
- Verify Python path exists: `C:\Users\massa\AppData\Local\Programs\Python\Python313\python.exe`
- Try clicking "Disable" button (uses registry_tweaker.py)

### Issue: "Command canceled or failed"
**Solution:**
- Check if you clicked "No" on UAC prompt (this is expected)
- Check Electron terminal for `[Bridge Error]` message
- If Python not found, install Python 3.13 to that location

---

## DevTools Tips

1. **Frontend Console** (in browser):
   - Filter for `[Frontend]` to see app logs
   - Shows button clicks and IPC errors

2. **Main Process Console** (in Electron DevTools):
   - Look in the "Sources" tab or main process console
   - Shows bridge logs and Python execution details

3. **Network Tab:**
   - Shows IPC messages if you're debugging communication

---

## Code Locations

- Frontend: [e:\Windows-Optimizer\frontend\app\page.tsx](e:\Windows-Optimizer\frontend\app\page.tsx)
- Electron: [e:\Windows-Optimizer\main.js](e:\Windows-Optimizer\main.js)
- Preload: [e:\Windows-Optimizer\preload.js](e:\Windows-Optimizer\preload.js)
- Python Backend: [e:\Windows-Optimizer\backend](e:\Windows-Optimizer\backend)
