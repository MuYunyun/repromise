# super-promise

The project is aim to realize promise with the Promise/A+.

### feature

-[ ] writen in ES6
-[ ] Promise.all
-[ ] Promise.race

### note

实现1：

```js
function pms1() {
  return new Promise(function (resolve, reject) {
    console.log('执行任务1')
    resolve('执行任务1成功')
  })
}

pms1()
  .then(function (data) {
    console.log(`第一个回调：${data}`)
  })

// 执行任务1
// 第一个回调：执行任务1成功
```
