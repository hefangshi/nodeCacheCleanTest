var edit = require('./lib/tmpEdit.js');
var path = require('path');
var assert = require('assert');
// var heapdump = require('heapdump');
var cleanCache = require('./lib/cleanCache.js');
var gcEx = require('./lib/gc.js');
var EventEmitter = require('events').EventEmitter;


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

        cleanCache(modulePath);
    } finally {
        edit.restoreAll();
    }
}

function simpleGCTest(cb) {
    // mem release test

    var modulePath = path.resolve(__dirname + path.sep + './case/largeMem.js');

    // prehot
    var arr;
    var retry = 50;
    while (retry--) {
        arr = require(modulePath)();
        cleanCache(modulePath);
    }
    gcEx(function () {
        var usageAfterPreHot = process.memoryUsage();
        // start retry
        retry = 2000;
        while (retry--) {
            arr = require(modulePath)();
            cleanCache(modulePath);
        }
        arr = null;
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

    var mem = require(modulePath)();
    var holder = [];

    // clean cache and require again

    var retry = 3000;
    while (retry--) {
        holder.push(require(modulePath)());
        cleanCache(modulePath);
    }
    gcEx(function () {
        var usageAfterReferenceTest = process.memoryUsage();
        // mem used by holder
        assert.ok(usageAfterReferenceTest.rss / usageBeforeReferenceTest.rss > 10);
        // release holder
        holder = null;
        mem = null;
        gcEx(function () {
            var usageAfterRelease = process.memoryUsage();
            assert.ok(usageAfterRelease.rss / usageBeforeReferenceTest.rss < 2);
            cb && cb();
        }, 'after reference test');
    }, 'before release reference');
}

function eventBindTest(cb) {
    var usageBeforeTest = process.memoryUsage();
    console.log('before event bind test: ', usageBeforeTest);
    var modulePath = path.resolve(__dirname + path.sep + './case/eventBind.js');
    var retry = 3000;
    while (retry--) {
        var arr = require('./case/largeMem.js')();
        var object = require(modulePath);
        object.on('whatever', function () {
            return arr;
        });
        cleanCache(modulePath);
    }
    gcEx(function () {
        var usageAfterTest = process.memoryUsage();
        assert.ok(usageAfterTest.rss / usageBeforeTest.rss < 2);
        cb && cb();
    }, 'after event bind test');
}

function eventReverseBindTest(cb) {
    var modulePath = path.resolve(__dirname + path.sep + './case/eventBindReverse.js');
    var retry = 1000;
    while (retry--) {
        var obj = new EventEmitter();
        var binder = require(modulePath);
        binder(obj);
        cleanCache(modulePath);
        obj = null;
    }
    gcEx(function () {
        var usageBeforeTest = process.memoryUsage();
        retry = 5000;
        while (retry--) {
            var obj = new EventEmitter();
            var binder = require(modulePath);
            binder(obj);
            cleanCache(modulePath);
            obj = null;
        }
        gcEx(function () {
            cb && cb();
        }, 'after reverse event bind test');
        var usageAfterTest = process.memoryUsage();
        assert.ok(usageAfterTest.rss / usageBeforeTest.rss < 2);
    }, 'before reverse event bind test');
}

basicTest();
simpleGCTest(function () {
    referenceTest(function () {
        eventBindTest(function () {
            eventReverseBindTest(function () {
                console.log(Object.keys(require.cache));
            });
        });
    });
});