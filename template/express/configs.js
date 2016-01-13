/**
 * 配置文件
 * @author ydr.me
 * @create 2016年01月13日14:30:30
 */


'use strict';

var path = require('path');

var env = process.env.ENVIRONMENT || 'local';
var webroot = env === 'local' ? 'dev' : 'pro';
var root = __dirname;

module.exports = {
    port: 10000,
    env: env,
    root: root,
    webroot: path.join(root, './webroot-' + webroot),
    console: {
        local: ['log', 'info', 'warn', 'error'],
        dev: ['warn', 'error'],
        test: ['error'],
        pro: ['error']
    }[env]
};
