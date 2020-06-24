const { BrowserWindow, ipcMain, net } = require('electron');
const crypto = require('crypto');
let win = null;
function showRegisterPanel() {
    win = new BrowserWindow({
        frame: false,
        width: 600,
        height: 400,
        minWidth: 600,
        minHeight: 400,
        resizable: false,
        movable: true,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    win.on('ready-to-show', () => {
        win.show();
    });

    // and load the index.html of the app.
    win.loadURL(REGISTER_WINDOW_WEBPACK_ENTRY);
    // Open the DevTools.

    // Emitted when the window is closed.
    win.on('closed', () => {
        win = null;
    });
}

ipcMain.on('CHANNEL_REGISTER', (e, cmd, data) => {
    switch (cmd) {
        case 'close':
            win.close();
            break;
        case 'show_dev_tools':
            win.webContents.openDevTools();
            break;
        case 'register':
            let request = net.request({
                method: 'POST',
                url: 'http://192.168.150.6:3000/wave/register'
            });
            request.on('response', resp => {
                resp.on('data', chunk => {
                    win.webContents.send('CHANNEL_REGISTER', 'register', chunk.toString());
                });
            });
            request.setHeader('Content-Type', 'application/json');
            let hash = crypto.createHash('md5');
            hash.update(data.password);
            data.password = hash.digest('hex');
            console.log(JSON.stringify(data));
            request.end(JSON.stringify(data));
            break;
    }
});
module.exports = { showRegisterPanel }
