const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const url = require('url');

let mainWindow;

const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0a0a0f',
    title: 'AI 修仙宗门经营',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, '../public/favicon.svg'),
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const template = [
    {
      label: '游戏',
      submenu: [
        {
          label: '保存游戏',
          accelerator: 'Ctrl+S',
          click: () => {
            mainWindow.webContents.send('save-game');
          },
        },
        {
          label: '读取存档',
          accelerator: 'Ctrl+L',
          click: () => {
            mainWindow.webContents.send('load-game');
          },
        },
        { type: 'separator' },
        {
          label: '重新开始',
          accelerator: 'Ctrl+R',
          click: () => {
            const result = dialog.showMessageBoxSync(mainWindow, {
              type: 'warning',
              buttons: ['取消', '确定'],
              defaultId: 0,
              title: '确认',
              message: '确定要重新开始吗？所有进度将丢失。',
            });
            if (result === 1) {
              mainWindow.webContents.send('init-game');
            }
          },
        },
        { type: 'separator' },
        {
          label: '退出',
          accelerator: 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: '视图',
      submenu: [
        {
          label: '刷新',
          accelerator: 'F5',
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: '切换全屏',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        {
          label: '开发者工具',
          accelerator: 'F12',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: '关于',
              message: 'AI 修仙宗门经营游戏',
              detail: '版本 1.0.0\n\n玩家扮演宗主管理由不同 AI 弟子组成的小宗门，体验修仙世界的经营与抉择。',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
