var fs = require('fs');

var origin = {};

module.exports.write = function (file, content) {
    if (!origin[file]) {
        origin[file] = fs.readFileSync(file);
    }
    fs.writeFileSync(file, content);
};

module.exports.restore = function (file) {
    if (origin[file]) {
        fs.writeFileSync(file, origin[file]);
    }
};

module.exports.get = fs.readFileSync;

module.exports.restoreAll = function () {
    for (var file in origin) {
        fs.writeFileSync(file, origin[file]);
    }
};