/**
 * 初始化
 * @author ydr.me
 * @create 2015-10-31 14:11
 */


'use strict';

var howdo = require('howdo');
var fs = require('fs');
var debug = require('ydr-utils').debug;
var typeis = require('ydr-utils').typeis;
var path = require('ydr-utils').path;

var banner = require('./banner.js');

/**
 * 生成文件
 * @param name {String} 文件名
 * @param destDirname {String} 目标地址
 * @param callback {Function} 回调
 * @returns {*}
 */
var writeFile = function (name, destDirname, callback) {
    var destPath = path.join(destDirname, name);
    var srcPath = path.join(__dirname, '../data/', name);

    if (typeis.file(destPath)) {
        debug.error('init error', path.toSystem(destPath) + ' is exist');
        return callback();
    }

    fs.createReadStream(srcPath)
        .pipe(fs.createWriteStream(destPath))
        .on('error', function (err) {
            debug.error(name, path.toSystem(destPath));
            debug.error('init error', err.message);
            process.exit(1);
        })
        .on('close', function () {
            debug.success('init success', path.toSystem(destPath));
            callback();
        });
};

/**
 * 生成配置文件
 * @param options {Object} 配置
 * @param options.destDirname {String} 根目录
 */
module.exports = function (options) {
    banner();
    howdo
        .task(function (done) {
            writeFile('coolie.config.js', options.destDirname, done);
        })
        .task(function (done) {
            writeFile('coolie-config.js', options.destDirname, done);
        })
        .together(function () {
            process.exit(1);
        });
};
