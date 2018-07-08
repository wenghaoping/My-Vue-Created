class Dep {
    constructor () {
        // 订阅的数组
        this.subs = [];
    }

    addSub (watcher) {
        this.subs.push(watcher);
    }
    // 通知
    notify () {
        // 调用每一个watcher的更新方法
        this.subs.forEach((watcher) => {
            watcher.update();
        })
    }
}
