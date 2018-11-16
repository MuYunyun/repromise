# repromise

The project is aim to understand the Promise/A+ better and try to realize an experimental version.

### Promise/A+ 核心

* Promise 操作只会处在 3 种状态的一种：未完成态(pending)、完成态(resolved) 和失败态(rejected);
* Promise 的状态只会出现从未完成态向完成态或失败态转化;
* Promise 的状态一旦转化，将不能被更改;

详细地可以参考[Promise/A+规范](https://segmentfault.com/a/1190000002452115#articleHeader3)

### Feature

[文档说明](https://github.com/MuYunyun/blog/blob/master/BasicSkill/readES6/Promise%E6%9C%AD%E8%AE%B0.md)

- [x] Promise.resolve(): 返回一个状态为 RESOLVED 的 promise 对象

- [x] Promise.reject(): 返回一个状态为 RESOLVED 的 promise 对象

- [x] Promise.all(arr): 当数组内所有元素状态都发生改变后，按照顺序返回结果数组

- [x] Promise.race(arr): 提供竞争机制，返回最早发生状态改变的元素

- [x] then: 链式调用

- [x] catch((err) => {}): 错误捕获

- [x] done((fulfilled) => {}, (err) => {}): 最终错误捕获, 参数可选

- [x] Promise.wrap(fn): 提供将回调函数 Promise 化的方法

### Summary

#### 坑点 1: 事件循环

> 事件循环：同步队列执行完后，在指定时间后再执行异步队列的内容。

之所以要单列事件循环，因为代码的执行顺序与其息息相关，此处用 setTimeout 来模拟事件循环；

下面代码片段中，① 处执行完并不会马上执行 setTimeout() 中的代码(③)，而是此时有多少次 then 的调用，就会重新进入 ② 处多少次后，再进入 ③

```js
excuteAsyncCallback(callback, value) {
  const that = this
  setTimeout(function() {
    const res = callback(value) // ③
    that.excuteCallback('fulfilled', res)
  }, 4)
}

then(onResolved, onRejected) {
  const promise = new this.constructor()
  if (this.state !== 'PENDING') {
    const callback = this.state === 'fulfilled' ? onResolved : onRejected
    this.excuteAsyncCallback.call(promise, callback, this.data)              // ①
  } else {
    this.callbackArr.push(new CallbackItem(promise, onResolved, onRejected)) // ②
  }
  return promise
}
```

#### 坑点 2: this 的指向问题

this.callbackArr.push() 中的 this 指向的是 ‘上一个’ promise，所以类 CallbackItem 中，this.promise 存储的是'下一个' promise(then 对象)。

```js
class Promise {
  ...
  then(onResolved, onRejected) {
    const promise = new this.constructor()
    if (this.state !== 'PENDING') {        // 第一次进入 then，状态是 RESOLVED 或者是 REJECTED
      const callback = this.state === 'fulfilled' ? onResolved : onRejected
      this.excuteAsyncCallback.call(promise, callback, this.data)  // 绑定 this 到 promise
    } else {                               // 从第二次开始以后，进入 then，状态是 PENDING
      this.callbackArr.push(new CallbackItem(promise, onResolved, onRejected)) // 这里的 this 也是指向‘上一个’ promise
    }
    return promise
  }
  ...
}

class CallbackItem {
  constructor(promise, onResolve, onReject) {
    this.promise = promise // 相应地，这里存储的 promise 是来自下一个 then 的
    this.onResolve = typeof(onResolve) === 'function' ? onResolve : (resolve) => {}
    this.onReject = typeof(onRejected) === 'function' ? onRejected : (rejected) => {}
  }
  ...
}
```

#### 坑点 3: 测试用例 test4.html

```js
new Promise((resolve, reject) => {resolve(Promise.resolve(1))})
```

类似这种结构的处理稍微有些复杂，日后有好的理解方式再续。调试完代码的感触是：

1. 还是事件循环
2. 还是要理清各个闭包存的 that(this) 值

#### 问题: promise.all 如何做到让多个 setTimeout 并发运行?

这个就是 promise.all() 的本质了，浏览器内部提供了一个事件循环机制来模拟成伪'并发'

```js
var oldTime = Date.now()
setTimeout(() => {console.log(Date.now() - oldTime)}, 1000) // 1001 ~ 1005(存在 4ms 的波动)
setTimeout(() => {console.log(Date.now() - oldTime)}, 2000) // 2001 ~ 2005
```

### Test

* [基础测试](https://github.com/MuYunyun/repromise/blob/master/test/test1.html)
* [连续 then 调用](https://github.com/MuYunyun/repromise/blob/master/test/test2.html)
* [resolve(Promise.resolve(1))](https://github.com/MuYunyun/repromise/blob/master/test/test3.html)
* [resolve(Promise.resolve(1)) + 连续 then 调用](https://github.com/MuYunyun/repromise/blob/master/test/test4.html)
* [Promise.all](https://github.com/MuYunyun/repromise/blob/master/test/%E6%B5%8B%E8%AF%95promise.all.html)
* [Promise.race](https://github.com/MuYunyun/repromise/blob/master/test/%E6%B5%8B%E8%AF%95promise.race.html)
* [Promise.wrap](https://github.com/MuYunyun/repromise/blob/master/test/node/回调函数promise化.js)

此外使用了 [promises-aplus-tests](https://github.com/promises-aplus/promises-tests/blob/master/README.md) 进行相对全面的 Promise/A+ 规范的用例测试，跑通了其提供的全部用例，结果如下：

![](http://oqhtscus0.bkt.clouddn.com/6f977ef37d7577217bcbe74c1b9b5e1b.jpg)

### 扩展延伸

```js
setTimeout(() => {
  console.log('A')
}, 0)

Promise.resolve(
  console.log('B')
).then(() => {
  console.log('C')
})

console.log('D')
```

正常情况下，此 demo 应该输出 `B D C A`, 这里涉及到宏任务和微任务的知识点，一个宏任务里可以有多个微任务。

* 宏任务(macroTask)：setTimeout
* 微任务(microTask)：promise

> 由于此项目中的 promise 是用 setTimeout 实现的，所以在上述 demo 中，此项目输出的结果是 `B D A C`, 解决方法：可以使用 `setImmediate` 替代 `setTimeout`，可以参考 [setImmediate.js](https://github.com/YuzuJS/setImmediate)。它的本质用了一些 hack 的手段，比如借用了 postMessage 这个来操作事件循环。