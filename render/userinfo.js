import { ipcRenderer } from 'electron'
import Vue from 'vue';
import ViewUI from 'view-design';
import TopBar from '../components/TopBar.vue';
import 'view-design/dist/styles/iview.css';
import '../scss/userinfo.scss';
console.log('👋 This message is being logged by "userinfo.js", included via webpack');
Vue.use(ViewUI);
new Vue({
    el: '#app',
    data: {
        uid: '',
        nickname: '',
        signature: '',
        portrait: '',
        buffer: ''
    },
    mounted() {
        ipcRenderer.on('CHANNEL_USERINFO', (e, cmd, data) => {
            switch (cmd) {
                case 'init':
                    this.uid = data.uid;
                    this.nickname = data.nickname;
                    this.signature = data.signature;
                    this.portrait = data.portrait;
                    break;
                case 'update':
                    if (!data) {
                        this.$Message.info('图片最大支持2M！');
                        return;
                    }
                    this.buffer = data;
                    this.portrait = URL.createObjectURL(new Blob([data], { type: 'image/jpg' }));
                    break;
            }
        });
    },
    methods: {
        changePortrait() {
            ipcRenderer.send('CHANNEL_USERINFO', 'open_dialog');
        },
        saveUserinfo() {
            ipcRenderer.send('CHANNEL_MAIN', 'save_userinfo', { buffer: this.buffer, nickname: this.nickname, signature: this.signature });
        },
        exit() {
            ipcRenderer.send('CHANNEL_USERINFO', 'close');
        },
        showDevTools() {
            ipcRenderer.send('CHANNEL_USERINFO', 'show_dev_tools');
        }
    },
    components: { TopBar }
})
