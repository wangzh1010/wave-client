const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');
const { app, BrowserWindow, ipcMain } = require('electron');
const Utils = require('./utils');
const { showRegisterPanel } = require('./register');
const { showUserinfoPanel, closeUserinfoPanel } = require('./userinfo');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    frame: false,
    width: 400,
    height: 300,
    minWidth: 400,
    minHeight: 300,
    resizable: false,
    movable: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (client) {
    client.end(Utils.encode({ exit: 0 }));
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
ipcMain.on('CHANNEL_MAIN', (e, cmd, data) => {
  switch (cmd) {
    case 'register':
      showRegisterPanel();
      break;
    case 'show_userinfo':
      showUserinfoPanel(data);
      break;
    case 'save_userinfo':
      let filename = Date.now() + '.jpg';
      fs.writeFile(path.resolve(__dirname, '../images', filename), data.buffer, err => {
        if (err) {
          throw err;
        }
        console.log('头像已保存到本地！');
      });
      // 服务端保存
      client.write(Utils.encode({ cmd: 'save_userinfo', filename: filename, uid: uid, nickname: data.nickname, signature: data.signature }, Utils.toBuffer(data.buffer)));
      // 更新本地图片
      mainWindow.webContents.send('CHANNEL_MAIN', 'update_portrait', { uid: uid, buffer: data.buffer });
      // 关闭用户信息页面
      closeUserinfoPanel();
      break;
    case 'login':
      login(cmd, data);
      break;
    case 'logout':
      client.write(Utils.encode({ cmd, ...data }));
      break;
    case 'chat_history':
      client.write(Utils.encode({ cmd, ...data }));
      break;
    case 'show_dev_tools':
      mainWindow.webContents.openDevTools();
      break;
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      mainWindow.maximize();
      break;
    case 'unmaximize':
      mainWindow.unmaximize();
      break;
    case 'exit':
      app.quit();
      break;
  }
});

ipcMain.on('CHANNEL_CHAT', (e, payload) => {
  console.log('send message to server: ', JSON.stringify(payload));
  payload.cmd = 'chat';
  client.write(Utils.encode(payload));
});

let client = null;
let uid = null;
function login(cmd, data) {
  let chunk = Buffer.alloc(0);
  client = net.connect('8124', '127.0.0.1', () => {
    console.log('已和服务器建立连接', data.uid, '登录ing...');
    let hash = crypto.createHash('md5');
    hash.update(data.password);
    data.password = hash.digest('hex');
    client.write(Utils.encode({ cmd, ...data }));
  });

  client.on('data', data => {
    chunk = Buffer.concat([chunk, data]);
    let payload = Utils.decode(chunk);
    if (payload) {
      chunk = Buffer.alloc(0);
      console.log('server message: ', payload);
      let cmd = payload.cmd;
      if (cmd === 'login') {
        // 当前登录用户id
        uid = payload.package.uid;
        // 下载
        let arr = [];
        let { exist, buffer } = Utils.getLocalImage(payload.package.filepath);
        if (!exist) {
          arr.push({ uid: payload.package.uid, filepath: payload.package.filepath });
        }
        payload.package.buffer = buffer;
        payload.package.friends.forEach(friend => {
          let { exist, buffer } = Utils.getLocalImage(friend.filepath);
          if (!exist) {
            arr.push({ uid: friend.uid, filepath: friend.filepath });
          }
          friend.buffer = buffer;
        });
        mainWindow.webContents.send('CHANNEL_MAIN', cmd, payload);
        if (payload.code === 10000) {
          mainWindow.setContentSize(800, 600);
          mainWindow.center();
        }
        // 下载图片 替换图片
        let timer = setInterval(() => {
          if (!arr.length) {
            clearInterval(timer);
            timer = null;
            return;
          }
          let data = arr.shift();
          // console.log(data);
          client.write(Utils.encode({ cmd: 'download', uid: data.uid, filepath: data.filepath }));
        }, 10);
      } else if (cmd === 'logout') {
        mainWindow.webContents.send('CHANNEL_MAIN', cmd);
        mainWindow.setContentSize(400, 300);
        mainWindow.center();
      } else if (cmd === 'chat') {
        mainWindow.webContents.send('CHANNEL_CHAT', payload);
      } else if (cmd === 'chat_history') {
        mainWindow.webContents.send('CHANNEL_MAIN', cmd, payload);
      } else if (cmd === 'download') {
        if (payload.buffer) {
          let filePath = path.resolve(__dirname, '../images', payload.filepath);
          // console.log(filePath);
          fs.writeFile(filePath, payload.buffer, err => {
            if (err) {
              throw err;
            }
          });
        }
        mainWindow.webContents.send('CHANNEL_MAIN', 'update_portrait', payload);
      } else {
        console.log('unhandle command.');
      }
    }
  });

  client.on('end', () => {
    // 断开socket连接
    console.log('server closed.');
    if (client) {
      client = null;
    }
  });
}
