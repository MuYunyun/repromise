# super-promise

The project is aim to understand the Promise/A+ better and try to realize an experimental version.

### feature

- [x] writen in ES6

- [x] Promise.resolve: 返回一个状态为 RESOLVED 的 promise 对象

- [x] Promise.all(arr): 当数组内所有元素状态都发生改变后，按照顺序返回结果数组

```js
var p1 = Promise.resolve(3)
var p2 = new Promise((resolve, reject) => {
  setTimeout(resolve, 2000, 'foo')
})
var p3 = 1337

Promise.all([p1, p2, p3]).then(values => {
  console.log(values) // [3, "foo", 1337]
})
```

- [x] Promise.race(arr): 提供竞争机制，最早发生状态改变的元素，最先返回

```js
var p1 = Promise.resolve(1)
var p2 = new Promise((resolve, reject) => {
  setTimeout(resolve, 2000, 2)
})
var p3 = 3

Promise.race([p1, p2, p3]).then(values => {
  console.log(values) // 1
})
```

### summary

#### 坑点 1：事件循环知识点

事件循环知识点：同步队列执行完后，在指定时间后再执行异步队列的内容。

对应如下代码：① 处执行完并不会马上执行 setTimeout() 中的代码，此时有多少次 then 的调用，就会重新进入 ② 处多少次。

```js
excuteAsyncCallback(callback, value) {
  const that = this
  setTimeout(function() {
    const res = callback(value)
    that.excuteCallback('resolve', res) // 事件循环知识点需巩固：比较巧妙 ③
  }, 4)
}

then(onResolved, onRejected) {
  const promise = new this.constructor()
  if (this.state !== 'PENDING') {
    const callback = this.state === 'RESOLVED' ? onResolved : onRejected
    this.excuteAsyncCallback.call(promise, callback, this.data)              // ①
  } else {
    this.callbackArr.push(new CallbackItem(promise, onResolved, onRejected)) // ②
  }
  return promise
}
```

#### 坑点 2：this 的指向问题

this.callbackArr.push() 中的 this 指向的是 ‘上一个’ promise，所以类 CallbackItem 中，this.promise 存储的是'下一个' promise(then 对象)。

```js
then(onResolved, onRejected) {
  const promise = new this.constructor()
  if (this.state !== 'PENDING') {        // 第一次进入 then，状态是 RESOLVED 或者是 REJECTED
    const callback = this.state === 'RESOLVED' ? onResolved : onRejected
    this.excuteAsyncCallback.call(promise, callback, this.data)  // 绑定 this 到 promise
  } else {                               // 从第二次开始以后，进入 then，状态是 PENDING
    this.callbackArr.push(new CallbackItem(promise, onResolved, onRejected)) // 这里的 this 也是指向‘上一个’ promise
  }
  return promise
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

#### 坑点 3：resolve(Promise.resolve(1))

类似这种有循环嵌套的 Promise 的处理稍微有些抽象，日后有好的理解方式再续。

### 测试

这个测试步骤也是开发步骤

- [x] 基础测试
- [x] 连续 then 调用
- [x] resolve(Promise.resolve(1))
- [x] resolve(Promise.resolve(1)) + 连续 then 调用
- [x] Promise.all()
- [x] Promise.race()
