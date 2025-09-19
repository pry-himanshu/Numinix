const { app, BrowserWindow } = require('electron');
function createWindow() {
  const win = new BrowserWindow({ width: 1200, height: 800 });
  win.loadFile('index.html'); // Or use win.loadURL('http://localhost:3000') for dev server
}
app.whenReady().then(createWindow);
