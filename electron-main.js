const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'Jago Corporation PLC - Office Management & Sales System',
    icon: path.join(__dirname, 'www/css/favicon.ico'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false
    },
    show: false,
    backgroundColor: '#0f172a'
  });

  // Load the web app index file
  const indexPath = path.join(__dirname, 'www/index.html');
  if (fs.existsSync(indexPath)) {
    mainWindow.loadFile(indexPath);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // External link handling
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createApplicationMenu();
}

function createApplicationMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Print Daybook / Report',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            if (mainWindow) mainWindow.webContents.print();
          }
        },
        { type: 'separator' },
        {
          label: 'Exit Desktop Application',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', accelerator: 'F5' },
        { role: 'forceReload', accelerator: 'CmdOrCtrl+F5' },
        { role: 'toggleDevTools', accelerator: 'F12' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn', accelerator: 'CmdOrCtrl+=' },
        { role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { type: 'separator' },
        { role: 'togglefullscreen', accelerator: 'F11' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Jago Office Management System',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Jago Corporation PLC',
              message: 'Jago Office Management & Sales Desktop Software',
              detail: 'Version 1.0.0 (Windows 11 64-bit Native Desktop Edition)\nDesigned for Sales, Daybook, Conveyance & Party Ledger Management.\n\n© 2026 Jago Corporation PLC.'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.jagocorp.officemanagement');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
