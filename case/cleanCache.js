module.exports = function (path) {
    var module = require.cache[path];
    // remove reference for cache
    module.parent.children.splice(module.parent.children.indexOf(module), 1);
    require.cache[path] = null;
};