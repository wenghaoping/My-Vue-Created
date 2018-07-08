// 观察者的目的就是给需要变化的那个元素增加观察者
// 观察者, 在数据变化的时候, 观察者中与该属性绑定的回调函数会被调用。
// const watcherHouse = [];
class Watcher {
    constructor (vm, expression, callback) {
        this.vm = vm;
        this.expression = expression;
        this.callback = callback;
        // 先获取一下老的值
        this.value = this.get();
    }

    // 获取其中的值
    _getVal (vm, expression) {
        let value = expression.split('.'); // [a, b, c]
        return value.reduce((prev, next) => {
            return prev[next];
        }, vm.$data);
    }
    // 获取老的值
    get () {
        Dep.target = this;
        return this._getVal(this.vm, this.expression);
        Dep.target = null;
    }
    // 对外暴露的方法
    update () {
        let newValue = this._getVal(this.vm, this.expression);
        let oldValue = this.value;
        if (newValue !== oldValue) {
            this.callback(newValue);
        }
    }
}
