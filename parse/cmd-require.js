/**
 * parse amd require()
 * @author ydr.me
 * @create 2015-10-26 11:41
 */


'use strict';

var path = require('ydr-utils').path;
var debug = require('ydr-utils').debug;

var globalId = require('../utils/global-id.js');


/**
 * require 正则
 * @type {RegExp}
 * @link https://github.com/seajs/seajs/blob/master/dist/sea-debug.js
 */
var REG_REQUIRE_SYNC = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\s*\(\s*(["'])(.+?)\1\s*\)/g;
var REG_REQUIRE_ASYNC = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|\.\s*require|(?:^|[^$])\brequire\.async\s*\(\s*(["'])(.+?)\1/g;


/**
 * 反斜杠
 * @type {RegExp}
 */
var REG_SLASH = /\\\\/g;


/**
 * require 类型
 * @type {RegExp}
 */
var REG_REQUIRE_TYPE = /([^"']+)(?:['"]\s*?,\s*?['"]([^'"]*))?/;


/**
 * 路径结尾
 * @type {RegExp}
 */
var REG_PATH_END = /(\/[^/]+?)?\/$/;


/**
 * 文件后缀
 * @type {RegExp}
 */
var REG_SUFFIX = /[\?#].*?$/;


/**
 * 脚本后缀
 * @type {RegExp}
 */
var REG_JS = /\.js($|\?)/i;


/**
 * 支持的模块类型
 * @type {{js: string[], json: string[], css: string[], text: string[], html: string[], image: string[]}}
 */
var supportMap = {
    js: {
        url: true,
        base64: true,
        text: true,
        js: true
    },
    json: {
        url: true,
        base64: true,
        text: true,
        js: true
    },
    css: {
        url: true,
        base64: true,
        text: true,
        js: true
    },
    text: {
        url: true,
        base64: true,
        text: true,
        js: true
    },
    html: {
        url: true,
        base64: true,
        text: true,
        js: true
    },
    image: {
        url: true,
        base64: true,
        js: true
    }
};


/**
 * 清理 url
 * @param url {String} 原始 URL
 * @param [isSingleURL=false] 是否为独立 URL
 * @returns {String}
 */
var cleanURL = function (url, isSingleURL) {
    url = url.replace(REG_SUFFIX, '');

    if (isSingleURL) {
        return url;
    }

    if (REG_PATH_END.test(url)) {
        url += 'index';
    }

    return url + (REG_JS.test(url) ? '' : '.js');
};


/**
 * 解析依赖，返回数组
 * @param file {String} 文件地址
 * @param options {Object} 配置
 * @param options.code {String} 代码
 * @param options.async {Boolean} 是否为异步 require
 * @returns {Array} 依赖数组
 */
module.exports = function (file, options) {
    var requires = [];
    var code = options.code;

    code.replace(REG_SLASH, '').replace(options.async ? REG_REQUIRE_ASYNC : REG_REQUIRE_SYNC, function ($0, $1, $2) {
        if ($2) {
            var matches = $2.match(REG_REQUIRE_TYPE);
            var pipeline = options.async ? ['js', 'js'] : (matches[2] ? matches[2].toLowerCase() : 'js').split('|');
            var name = cleanURL(matches[1], !!matches[2]);
            var id = path.join(path.dirname(file), name);
            var inType = pipeline[0];
            var outType = pipeline[1] || 'js';
            var findInType = supportMap[inType];

            if (!findInType) {
                debug.error('parse cmd require', path.toSystem(file));
                debug.error('parse cmd require', 'can not support `' + inType + '` module');
                return process.exit(1);
            }

            var findOutType = findInType[outType];

            if (!findOutType) {
                debug.error('parse cmd require', path.toSystem(file));
                debug.error('parse cmd require', 'can not support `' + inType + '` => `' + outType + '`');
                return process.exit(1);
            }

            var dep = {
                id: id + '|' + outType,
                file: id,
                gid: globalId.get(id, outType),
                raw: matches[1],
                name: name,
                inType: inType,
                outType: outType
            };

            requires.push(dep);
        }
    });

    return requires;
};




