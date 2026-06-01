const { app, BrowserWindow } = require('electron');

function createWindow() {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false, // Remove the window frame
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Load the index.html of the app.
    win.loadFile('index.html');

    // Open the DevTools.
    // win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
