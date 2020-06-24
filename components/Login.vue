<template>
  <div class="login">
    <top-bar>
      <span slot="caption">登录</span>
      <button class="win-tools" type="button" @click="tools" title="开发者工具"></button>
      <button class="win-min" type="button" @click="minimize" title="最小化"></button>
      <button class="win-close" type="button" @click="exit" title="关闭"></button>
    </top-bar>
    <div class="wrapper">
      <input type="text" v-model="username" placeholder="用户名" />
      <input type="password" v-model="password" placeholder="密码" />
      <button class="btn btn-primary login-btn" type="button" @click="login">登录</button>
      <div class="register">
        <a href="javascript:;" @click="register">注册</a>
      </div>
    </div>
  </div>
</template>
<script>
import TopBar from "./TopBar.vue";
export default {
  data() {
    return {
      username: "",
      password: ""
    };
  },
  methods: {
    exit() {
      this.$emit("exit");
    },
    minimize() {
      this.$emit("minimize");
    },
    tools() {
      this.$emit("tools");
    },
    login() {
      if (!this.username) {
        this.$Message.info("请输入用户名");
        return;
      }
      if (!this.password) {
        this.$Message.info("请输入密码");
        return;
      }
      this.$emit("login", { username: this.username, password: this.password });
    },
    register() {
      this.$emit("register");
    }
  },
  components: { TopBar }
};
</script>
<style lang="scss" scoped>
.login {
  width: 100vw;
  height: 100vh;
  .wrapper {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100vw;
    height: calc(100vh - 40px);
    background-color: #eef5ff;
  }
  input {
    width: 200px;
    margin-bottom: 10px;
  }
  .login-btn {
    width: 200px;
  }
  .register {
    width: 200px;
    line-height: 32px;
    text-align: right;
  }
}
</style>
