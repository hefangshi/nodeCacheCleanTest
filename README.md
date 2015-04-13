Simple Test with Node Cache System

=====================

[![Build Status](https://travis-ci.org/hefangshi/nodeCacheCleanTest.svg?branch=master)](https://travis-ci.org/hefangshi/nodeCacheCleanTest)


## 目标

日常Node开发可以不重启或者reload来实现代码热更新

## 坑

### require.cache

不可以直接删除 `require.cache` 中的内容，会由于 `parent` 中包含了引用导致内存无法释放

```
module.parent.children.splice(module.parent.children.indexOf(module), 1);
require.cache[path] = null;
```

## 待测

- 回调函数对内存回收的影响
- 事件监听对内存回收的影响

