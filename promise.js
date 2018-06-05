class Promise {
  constructor(resolver) {
    this.resolver = resolver
    this.state = 'PENDING'
    this.data = undefined
    // this.callbackArr = []
    if (typeof(resolver) === 'function') {
      this.excuteResolve(resolver)
    }

    this.excuteResolve = this.excuteResolve.bind(this)
    this.excuteCallback = this.excuteCallback.bind(this)
    this.excuteAsyncCallback = this.excuteAsyncCallback.bind(this)
    this.then = this.then.bind(this)
    this.getThen = this.getThen.bind(this)
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
      // this.callbackArr.forEach(fn => fn[type](value))
    }
  }

  excuteAsyncCallback(callback, value) {
    const that = this
    setTimeout(() => {
      const res = callback(value)
      that.excuteCallback('resolve', res)
    }, 4)
  }

  then(onResolved, onRejected) {
    if ((typeof(onResolved) !== 'function' && this.state === 'RESOLVED') ||
    (typeof(onRejected) !== 'function' && this.state === 'REJECTED')) {
      return this
    }
    const promise = new this.constructor() // 返回构造函数
    if (this.state !== 'PENDING') {
      const callback = this.state === 'RESOLVED' ? onResolved : onRejected
      this.excuteAsyncCallback(callback, this.data)
    }
    // else {  // 疑问：什么时候能进这个分支
    //   this.callbackArr.push(new CallbackItem(onResolved, onRejected))
    // }
    return promise
  }
}

// class CallbackItem {
//   constructor(onResolve, onReject) {
//     this.onResolve = typeof(onResolve) === 'function' ? onResolve : (resolve) => {}
//     this.onReject = typeof(onRejected) === 'function' ? onRejected : (rejected) => {}
//   }

//   resolve() {

//   }

//   reject() {

//   }
// }