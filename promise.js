class Promise {
  constructor(resolver) {
    this.resolver = resolver
    this.state = 'PENDING'
    this.data = undefined
    this.callbackArr = []
    if (typeof(resolver) === 'function') {
      this.excuteResolve(resolver)
    }
  }

  excuteResolve(resolver) {
    const that = this
    let cb = false
    const resolve = function(value) { // 约定
      if (cb) {                       // resolve 和 reject 只会执行一个
        return
      }
      cb = true
      that.excuteCallback('resolve', value)
    }
    const reject = function(value) {
      if (cb) {
        return
      }
      cb = true
      that.excuteCallback('reject', value)
    }
    resolver(resolve, reject)
  }

  getThen(value) {
    if (typeof(value) === 'object' && typeof(value.then) === 'function') {
      const that = this
      return function() {
        that.excuteResolve(value.then)
      }
    } else {
      return false
    }
  }

  excuteCallback(type, value) {
    const isResolve = type === 'resolve'
    const thenable = this.getThen(value)
    if (thenable) { // 如果是 thenable 对象
      thenable()
    } else {
      this.state = isResolve ? 'RESOLVED' : 'REJECTED'
      this.data = value
      this.callbackArr.forEach(fn => fn[type](value)) // ④
    }
    // return this
  }

  excuteAsyncCallback(callback, value) {
    const that = this
    setTimeout(function() {
      const res = callback(value)
      that.excuteCallback('resolve', res) // 事件循环的知识点需巩固：比较巧妙 ③ ⑥
    }, 4)
  }

  then(onResolved, onRejected) {
    if ((typeof(onResolved) !== 'function' && this.state === 'RESOLVED') ||
    (typeof(onRejected) !== 'function' && this.state === 'REJECTED')) {
      return this
    }
    const promise = new this.constructor() // 创建一个新的 promise 实例，作用一：链式调用；作用二：传进 CallbackItem 中，使其能调用 Promise 的方法
    if (this.state !== 'PENDING') {        // 第一次进入 then，状态是 RESOLVED 或者是 REJECTED
      const callback = this.state === 'RESOLVED' ? onResolved : onRejected
      this.excuteAsyncCallback.call(promise, callback, this.data)  // 绑定 this 到 promise                    ①
    } else {                               // 从第二次开始以后，进入 then，状态是 PENDING
      this.callbackArr.push(new CallbackItem(promise, onResolved, onRejected)) // 这里的 this 也是指向‘上一个’ promise ②
    }
    return promise
  }
}

class CallbackItem {
  constructor(promise, onResolve, onReject) {
    this.promise = promise // 相应地，这里存储的 promise 是来自下一个 then 的
    this.onResolve = typeof(onResolve) === 'function' ? onResolve : (resolve) => {}
    this.onReject = typeof(onRejected) === 'function' ? onRejected : (rejected) => {}
  }

  resolve(value) {
    this.promise.excuteAsyncCallback(this.onResolve, value) // ⑤
  }

  reject(value) {
    this.promise.excuteAsyncCallback(this.onReject, value)
  }
}