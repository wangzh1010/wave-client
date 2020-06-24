import { ipcRenderer } from 'electron'
import Vue from 'vue';
import ViewUI from 'view-design';
import 'view-design/dist/styles/iview.css';
import '../scss/register.scss';
import TopBar from '../components/TopBar.vue';
console.log('👋 This message is being logged by "register.js", included via webpack');
Vue.use(ViewUI);

new Vue({
    el: '#app',
    data: {
        username: '',
        password: '',
        confirmPassword: ''
    },
    mounted() {
        ipcRenderer.on('CHANNEL_REGISTER', (e, cmd, data) => {
            switch (cmd) {
                case 'register':
                    console.log(data);
                    let resp = JSON.parse(data);
                    this.$Message.success(resp.message);
                    if (resp.code === 200) {
                        ipcRenderer.send('CHANNEL_REGISTER', 'close');
                    }
                    break;
            }
        })
    },
    methods: {
        register() {
            if (!this.username) {
                this.$Message.warning('登录名不能为空！');
                return;
            }
            if (!/^\d{11}$/.test(this.username)) {
                this.$Message.warning('请正确输入登录名！');
                return;
            }
            if (!this.password) {
                this.$Message.warning('密码不能为空！');
                return;
            }
            if (!this.confirmPassword) {
                this.$Message.warning('请确认密码！');
                return;
            }
            if (this.password !== this.confirmPassword) {
                this.$Message.warning('两次输入的密码不一致！');
                return;
            }
            ipcRenderer.send('CHANNEL_REGISTER', 'register', { username: this.username, password: this.password });
        },
        exit() {
            ipcRenderer.send('CHANNEL_REGISTER', 'close');
        },
        showDevTools() {
            ipcRenderer.send('CHANNEL_REGISTER', 'show_dev_tools');
        }
    },
    components: {
        TopBar
    }
});
