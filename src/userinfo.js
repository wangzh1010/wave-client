const fs = require('fs');
const { BrowserWindow, ipcMain, dialog } = require('electron');
let win = null;
function showUserinfoPanel(data) {
    win = new BrowserWindow({
        frame: false,
        width: 400,
        height: 600,
        minWidth: 400,
        minHeight: 600,
        resizable: false,
        movable: true,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.on('ready-to-show', () => {
        win.webContents.send('CHANNEL_USERINFO', 'init', data);
        win.show();
    });

    // and load the index.html of the app.
    win.loadURL(USERINFO_WINDOW_WEBPACK_ENTRY);
    // Open the DevTools.
    // Emitted when the window is closed.
    win.on('closed', () => {
        win = null;
    });
}

function closeUserinfoPanel() {
    win.close();
}

ipcMain.on('CHANNEL_USERINFO', (e, cmd, data) => {
    switch (cmd) {
        case 'open_dialog':
            dialog.showOpenDialog(win, {
                title: '选择图片',
                filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }],
                properties: ['openFile']
            }).then(result => {
                if (result.canceled) {
                    return;
                }
                fs.readFile(result.filePaths[0], (err, buffer) => {
                    if (err) {
                        throw err;
                    }
                    // max size 2M
                    if (buffer.length > 2 * 1024 * 1024) {
                        win.webContents.send('CHANNEL_USERINFO', 'update');
                    } else {
                        win.webContents.send('CHANNEL_USERINFO', 'update', buffer);
                    }
                });
            }).catch(e => {
                console.log(e);
            });
            break;
        case 'close':
            win.close();
            break;
        case 'show_dev_tools':
            win.webContents.openDevTools();
            break;
    }
});
module.exports = { showUserinfoPanel, closeUserinfoPanel }
