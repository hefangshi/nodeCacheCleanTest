var edit = require('./lib/tmpEdit.js');
var path = require('path');
var assert = require('assert');
// var heapdump = require('heapdump');
var cleanCache = require('./lib/cleanCache.js');
var gcEx = require('./lib/gc.js');


function basicTest() {
    try {
        var modulePath = path.resolve(__dirname + path.sep + './case/basic.js');

        // first require
        var empty = require(modulePath);
        assert.equal(empty, 0);

        // start edit

        edit.write(modulePath, 'module.exports = 1;');
        assert.equal(empty, 0);
        assert.equal(require(modulePath), 0);

        // clean cache and require again

        cleanCache(modulePath);
        assert.equal(empty, 0);
        assert.equal(require(modulePath), 1);
    } finally {
        edit.restoreAll();
    }
}

function simpleGCTest(cb) {
    // mem release test

    var modulePath = path.resolve(__dirname + path.sep + './case/largeMem.js');

    // first require

    var mem = require(modulePath);

    // prehot

    var retry = 50;
    while (retry--) {
        cleanCache(modulePath);
        require(modulePath);
    }
    gcEx(function () {
        var usageAfterPreHot = process.memoryUsage();
        // start retry
        retry = 2000;
        while (retry--) {
            cleanCache(modulePath);
            require(modulePath);
        }
        gcEx(function () {
            var usageAfterRetry = process.memoryUsage();
            assert.ok(usageAfterRetry.rss / usageAfterPreHot.rss < 10);
            cb && cb();
        }, 'after gc test');
    }, 'before gc test');

}

function referenceTest(cb) {
    var usageBeforeReferenceTest = process.memoryUsage();
    console.log('before reference test: ', usageBeforeReferenceTest);

    // reference test

    var modulePath = path.resolve(__dirname + path.sep + './case/largeMem.js');

    // first require

    var mem = require(modulePath);

    var holder = [];

    // clean cache and require again

    var retry = 3000;
    while (retry--) {
        cleanCache(modulePath);
        holder.push(require(modulePath));
    }
    gcEx(function () {
        var usageAfterReferenceTest = process.memoryUsage();
        // mem used by holder
        assert.ok(usageAfterReferenceTest.rss / usageBeforeReferenceTest.rss > 10);
        // release holder
        holder = null;
        gcEx(function () {
            var usageAfterRelease = process.memoryUsage();
            assert.ok(usageAfterRelease.rss / usageBeforeReferenceTest.rss < 2);
            cb && cb();
        }, 'after reference test');
    }, 'before release reference');
}

basicTest();
simpleGCTest(function () {
    referenceTest(function () {

    });
});