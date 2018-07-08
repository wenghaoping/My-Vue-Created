class Compile {
    // 传入$el, mvvm this
    constructor (el, vm) {
        // 判断是否是元素节点
        this.$el = this.isElementNode(el) ? el : document.querySelector(el);
        this.$vm = vm;
        if (this.$el) {
            // 如果这个元素能获取到，首先先取到节点，如果一个个取值，则性能很差

            // 1.先把这些真实的DOM移入到内存中fragment
            let $fragment = this.node2Fragment(this.$el);
            // 2.编译 => 提取想要的元素节点v-model 和文本节点 {{}}
            this.compile($fragment);

            // 3.把编译好的fragment在放回页面里去
            this.$el.appendChild($fragment);

        }
    }
    // 写辅助方法

    // 是不是元素节点
    isElementNode (node) {
        // document.body.nodeType === 1;
        // 返回1，代表是一个元素
        return node.nodeType === 1;
    }

    // 是不是指令
    isDirective (attr) {
        return attr.includes('v-');
    }


    // 核心方法

    // 编译元素节点
    compileElement (node) {
        // 带v-
        let attrs = node.attributes;// 取出当前节点的属性
        Array.from(attrs).forEach(attr => {
            // 判断属性名字是否包含v-model v-text
            const attrName = attr.name;
            // 取出属性对应的值 message user.firstname ....
            const expression = attr.value;
            // 判断是不是指令
            if (this.isDirective(attrName)) {
                // 取对应的值放到节点中
                // node vm.$data expression
                // 取到对应的方法，model text .....
                const type = attrName.slice(2);
                CompileUtil[type](node, this.$vm, expression);

            }
        })
    }

    // 编译文本节点
    compileText (node) {
        // 带 {{ }}
        const expression = node.textContent; // textContent 属性设置或者返回指定节点的文本内容。

        const reg = /{\{([^}]+)\}\}/g;
        if (reg.test(expression)) {
            // node vm.$data text
            CompileUtil['text'](node, this.$vm, expression);
        }
    }

    // 开始解析模板
    compile(fragment) {
        // 返回指定元素的子节点集合，包括元素节点和文本节点。返回文档集合
        const childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node => {
            // 判断是否是元素节点，和文本节点
            if (this.isElementNode(node)) {
                // 是元素节点 是否存在v-
                // 这里编译元素
                this.compileElement(node);
                // 如果是元素节点，继续深入检查, 需要递归
                this.compile(node);
            } else {
                // 文本节点
                // 这里编译文本
                this.compileText(node);
            }
        })
    }
    // 需要将el中的内容全部放到内存中
    node2Fragment (el) {
        // 创建文档片段对象，不是真实的dom 11，内存中的dom节点
        // 操作Fragmen，不会造成页面重绘
        let fragment = document.createDocumentFragment();
        // 将原来的每一个节点都移入到文档片段中
        // 第一个节点
        let firstChile = null;
        // 获取指定元素的第一个子节点，可以是元素节点，也可以是文本节点。
        while (firstChile = el.firstChild) {
            fragment.appendChild(firstChile);
        }
        // 返回内存中的节点
        return fragment;
    }
}

CompileUtil = {
    // 获取其中的值
    _getVal (vm, expression) {
        let value = expression.split('.'); // [a, b, c]
        return value.reduce((prev, next) => {
            return prev[next];
        }, vm.$data);
    },
    // 获取编译以后的文本的结果
    _getTextVal (vm, expression) {
        return expression.replace(/{\{([^}]+)\}\}/g, (...arguments) => {
            return this._getVal(vm, arguments[1]);
        });
    },
    // 设置值
    _setVal (vm, expression, newValue) { // [message, a]
        let value = expression.split('.');
        return value.reduce((prev, next, currentIndex) => {
            if (currentIndex === value.length - 1) {
                return prev[next] = newValue;
            }
            return prev[next];
        }, vm.$data);
    },
    // 文本处理
    text (node, vm, expression) {
        let updaterFn = this.updater['textUpdater'];
        // expression === {{user.firstname}} => user.firstname
        expression.replace(/{\{([^}]+)\}\}/g, (...arguments) => {
            new Watcher(vm, arguments[1], (newValue) => {
                // 当值变化后，会调用callback，将新的值传过来
                updaterFn && updaterFn(node, this._getTextVal(vm, newValue));
            });
        });

        updaterFn && updaterFn(node, this._getTextVal(vm, expression));
    },
    // 输入框处理
    model (node, vm, expression) {
        let updaterFn = this.updater['modelUpder'];
        // 这里需要添加监控，数据变化了，应该调用这个watch的callback
        new Watcher(vm, expression, (newValue) => {
            // 当值变化后，会调用callback，将新的值传过来
            updaterFn && updaterFn(node, this._getVal(vm, expression));
        });
        node.addEventListener('input', (e) => {
            let newValue = e.target.value;
            this._setVal(vm, expression, newValue);
        });
        updaterFn && updaterFn(node, this._getVal(vm, expression));
    },
    updater: {
        // 文本更新
        textUpdater (node, value) {
            node.textContent = typeof value === 'undefined' ? '' : value;
        },
        // 输入框更新
        modelUpder (node, value) {
            node.value = typeof value === 'undefined' ? '' : value;
        }
    }
}
