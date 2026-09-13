const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Handle Native Desktop PDF File Saving
ipcMain.handle('save-pdf-file', async (event, { dataUrl, filename }) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save PDF Report / Invoice Document',
      defaultPath: filename || 'Jago_Document.pdf',
      filters: [{ name: 'PDF Documents (*.pdf)', extensions: ['pdf'] }]
    });

    if (filePath) {
      const base64Data = dataUrl.replace(/^data:application\/pdf;filename=generated\.pdf;base64,/, '')
                                .replace(/^data:application\/pdf;base64,/, '')
                                .replace(/^data:application\/octet-stream;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
      return { success: true, filePath };
    }
    return { success: false, cancelled: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Handle Native Desktop JSON Backup File Saving
ipcMain.handle('save-json-file', async (event, { jsonContent, filename }) => {
  try {
    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Jago System Data Backup (.json)',
      defaultPath: filename || `Jago_Sales_Backup_${new Date().toISOString().split('T')[0]}.json`,
      filters: [{ name: 'JSON Backup Files (*.json)', extensions: ['json'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, jsonContent, 'utf-8');
      return { success: true, filePath };
    }
    return { success: false, cancelled: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Native Electron PDF Generation Engine via printToPDF
ipcMain.handle('generate-electron-pdf', async (event, { filename, orientation, htmlContent }) => {
  try {
    const pdfWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; margin: 15px; color: #0f172a; background: #ffffff; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 0.85rem; }
          th { background: #f1f5f9; color: #0f172a; font-weight: 700; text-align: left; }
          .no-print, button, input:not([type="text"]), select, .btn-icon { display: none !important; }
        </style>
      </head>
      <body>
        ${htmlContent}
      </body>
      </html>
    `;

    await pdfWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml));

    const pdfBuffer = await pdfWin.webContents.printToPDF({
      printBackground: true,
      landscape: orientation === 'landscape',
      pageSize: 'A4',
      margins: { top: 0.3, bottom: 0.3, left: 0.3, right: 0.3 }
    });

    pdfWin.close();

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save PDF Report / Document',
      defaultPath: filename || 'Jago_Document.pdf',
      filters: [{ name: 'PDF Documents (*.pdf)', extensions: ['pdf'] }]
    });

    if (filePath) {
      fs.writeFileSync(filePath, pdfBuffer);
      return { success: true, filePath };
    }
    return { success: false, cancelled: true };
  } catch (err) {
    console.error('Native Electron PDF Error:', err);
    return { success: false, error: err.message };
  }
});

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

  // Enable native file download handling in Electron session
  mainWindow.webContents.session.on('will-download', (event, item) => {
    const savePath = path.join(app.getPath('downloads'), item.getFilename());
    item.setSavePath(savePath);
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
