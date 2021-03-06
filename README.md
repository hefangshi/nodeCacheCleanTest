Simple Test with Node Cache System

=====================

[![Build Status](https://travis-ci.org/hefangshi/nodeCacheCleanTest.svg?branch=master)](https://travis-ci.org/hefangshi/nodeCacheCleanTest)


## 目标

日常Node开发可以不重启或者reload来实现代码热更新

## 结论

- cache删除后，代码可以在下次require时正常更新
- cache删除后，已经require的变量并不会有影响，并且会持续占用内存
- Plain Object或者没有事件监听的Class在cache删除后内存会自动释放
- 调用方监听模块的事件，在cache删除后，只要模块正常释放，不会造成内存泄露，参考 `eventBindTest`

  ```
  var moduleA = require('moduleA');
  moduleA.on('whatever', function () {

  });
  moduleA = null;
  ```

- 模块监听调用方自然是不行的，一定会持续占用内存，并且造成监听数上升引发Node内存泄露报警
  
  ```
  var moduleA = require('moduleA');
  var obj = new require('events').EventEmitter();
  moduleA.bind(obj);
  ```

- 模块监听调用方中对象的事件，对象释放后，不会造成内存泄露，参考 `eventReverseBindTest`

  ```
  var moduleA = require('moduleA');
  var obj = new require('events').EventEmitter();
  moduleA.bind(obj);
  obj = null;
  ```

## 关于模块对象释放

- 在Web应用中，主要场景的入口为请求处理的中间件，中间件内闭包中声明的对象均会在请求结束后自动释放
- 在yog2中，会对action在dispatcher插件中做缓存，为了更新action的代码需要在热加载触发后不仅仅删除缓存，还需要将dispatcher插件的缓存删除以释放action中的模块变量

## 坑

### require.cache

不可以仅删除 `require.cache` 中的内容，会由于 `parent` 中包含了引用导致内存无法释放

正确做法如下

```
module.parent.children.splice(module.parent.children.indexOf(module), 1);
require.cache[path] = null;
```

## 待测

- 回调函数对内存回收的影响
