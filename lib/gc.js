module.exports = function (cb, description) {
    if (global.gc) {
        gc();
    } else {
        throw new Error('run with node --expose_gc');
    }
    setTimeout(function () {
        if (description) {
            console.log(description, ":", process.memoryUsage());
        }
        cb && cb();
    }, 500);
};