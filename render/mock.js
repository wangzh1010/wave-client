let nicknames = ['Alice', 'Roay', 'Lamd', 'Bob'];
let signatures = ['千山鸟飞绝', '万径人踪灭', '孤舟蓑笠翁', '独钓寒江雪'];
let Virtual = {};

Virtual.vNickname = function () {
    let index = Math.floor(Math.random() * nicknames.length);
    return nicknames[index];
}

Virtual.vSignature = function () {
    let index = Math.floor(Math.random() * signatures.length);
    return signatures[index];
}

export default Virtual;
