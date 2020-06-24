/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/application-architecture#main-and-renderer-processes
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

const { remote, ipcRenderer } = require('electron');
const { Menu } = remote;
import Vue from 'vue';
import ViewUI from 'view-design';
import Mock from './mock';
import 'view-design/dist/styles/iview.css';
import '../scss/index.scss';
console.log('👋 This message is being logged by "renderer.js", included via webpack');
Vue.use(ViewUI);
import Login from '../components/Login.vue'

new Vue({
    el: '#app',
    data: {
        uid: '',
        nickname: '',
        signature: '',
        portrait: '',
        fid: '',
        fnickname: '',
        fportrait: '',
        friends: [],
        maximize: false,
        contextMenu: null,
        topMenuShow: false,
        showSetting: false,
        isLogin: false,
        message: '',
        messages: []
    },
    mounted() {
        let template = [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'delete' },
            { type: 'separator' },
            { role: 'selectall' }
        ];
        this.contextMenu = Menu.buildFromTemplate(template);
        this.handleActions();
    },
    methods: {
        register() {
            ipcRenderer.send('CHANNEL_MAIN', 'register');
        },
        showUserInfo() {
            ipcRenderer.send('CHANNEL_MAIN', 'show_userinfo', { uid: this.uid, nickname: this.nickname, signature: this.signature, portrait: this.portrait });
            this.topMenuShow = false;
        },
        login({ username, password }) {
            this.uid = username;
            ipcRenderer.send('CHANNEL_MAIN', 'login', { uid: username, password: password });
        },
        logout() {
            this.fid = '';
            this.fnickname = '';
            this.fportrait = '';
            this.friends = [];
            this.message = '';
            this.messages = [];
            ipcRenderer.send('CHANNEL_MAIN', 'logout', { uid: this.uid });
        },
        sendMessage() {
            if (!this.isLogin) {
                this.$Message.warning('请登录');
                return;
            }
            if (!this.message) {
                this.$Message.warning('信息不能为空');
                return;
            }
            let message = { from: this.uid, to: this.fid, message: this.message };
            this.messages.push(message);
            ipcRenderer.send('CHANNEL_CHAT', message);
            this.message = '';
        },
        sendImage() {
            this.$Message.info('敬请期待');
        },
        winMinimize() {
            ipcRenderer.send('CHANNEL_MAIN', 'minimize');
        },
        winMaximize() {
            if (this.maximize) {
                ipcRenderer.send('CHANNEL_MAIN', 'unmaximize');
            } else {
                ipcRenderer.send('CHANNEL_MAIN', 'maximize');
            }
            this.maximize = !this.maximize;
        },
        winExit() {
            ipcRenderer.send('CHANNEL_MAIN', 'exit');
        },
        showMenu(e) {
            e.preventDefault();
            this.contextMenu.popup(remote.getCurrentWindow());
        },
        toggleTopMenu() {
            this.topMenuShow = !this.topMenuShow;
        },
        toggleSetting() {
            this.showSetting = !this.showSetting;
        },
        changeChatFriend(uid) {
            if (this.fid === uid)
                return;
            this.fid = uid;
            let friend = this.friends.find(friend => friend.uid === uid);
            this.fnickname = friend.nickname;
            this.fportrait = friend.portrait;
            ipcRenderer.send('CHANNEL_MAIN', 'chat_history', { uid: this.uid, fid: this.fid });
        },
        showDevTools() {
            ipcRenderer.send('CHANNEL_MAIN', 'show_dev_tools');
            this.showSetting = false;
        },
        handleActions() {
            ipcRenderer.on('CHANNEL_MAIN', (e, cmd, data) => {
                console.log(data);
                if (cmd === 'login') {
                    if (data.code === 10000) {
                        this.isLogin = true;
                        let pkg = data.package;
                        if (pkg.status === 0) {
                            pkg.nickname = Mock.vNickname();
                            pkg.signature = Mock.vSignature();
                        }
                        this.nickname = pkg.nickname;
                        this.signature = pkg.signature;
                        this.portrait = URL.createObjectURL(new Blob([pkg.buffer], { type: 'image/jpg' }));
                        pkg.friends.forEach(f => {
                            f.portrait = URL.createObjectURL(new Blob([f.buffer], { type: 'image/jpg' }));
                        });
                        this.friends = pkg.friends;
                    } else if (data.code === 10401) {
                        this.$Message.error('用户名密码错误！');
                    } else {
                        this.$Message.warning('登录失败！');
                    }
                } else if (cmd === 'logout') {
                    this.topMenuShow = false;
                    this.isLogin = false;
                } else if (cmd === 'chat_history') {
                    console.log(data);
                    this.messages = data.histories;
                } else if (cmd === 'update_portrait') {
                    if (data.uid === this.uid) {
                        this.portrait = URL.createObjectURL(new Blob([data.buffer], { type: 'image/jpg' }));
                    } else {
                        let friend = this.friends.find(friend => friend.uid === data.uid);
                        friend.portrait = URL.createObjectURL(new Blob([data.buffer], { type: 'image/jpg' }));
                    }
                } else {
                    console.log('emmmmmmm');
                }
            });
            ipcRenderer.on('CHANNEL_CHAT', (e, payload) => {
                console.log('chat payload', payload);
                let fid = payload.from;
                let friend = this.friends.find(friend => friend.uid === fid);
                friend.messages.push({ uid: fid, message: payload.message });
            });
        }
    },
    components: { Login }
})
