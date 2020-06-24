<template>
  <div class="topbar">
    <slot name="caption"></slot>
    <div>
      <slot></slot>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.topbar {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  background-color: #3f9ff9;
  -webkit-app-region: drag;
  -webkit-user-select: none;
  position: relative;
  color: #ffffff;
}
</style>
