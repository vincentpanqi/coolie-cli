/**
 * html attr script replace
 * @author ydr.me
 * @create 2015-10-22 18:41
 */


'use strict';

var dato = require('ydr-utils').dato;
var path = require('ydr-utils').path;

var htmlAttr = require('../utils/html-attr.js');
var pathURI = require('../utils/path-uri.js');
var minifyJS = require('../minify/js.js');

var JS_TYPES = [
    'javascript',
    'text/javascript',
    'text/ecmascript',
    'text/ecmascript-6',
    'text/jsx',
    'application/javascript',
    'application/ecmascript'
];
var COOLIE_IGNORE = 'coolieignore';
var COOLIE = 'coolie';
var REG_SCRIPT = /(<script\b[\s\S]*?>)([\s\S]*?)<\/script>/ig;
// 有歧义的代码片段
var REG_AMBIGUITY_SLICE = /}};?<\/script>$/;
var REG_LINE = /[\n\r]/g;
var REG_SPACE = /\s+/g;


/**
 * 替换 html script
 * @param file {String} 文件
 * @param options {Object} 配置
 * @param options.code {String} 代码
 * @param options.srcDirname {String} 构建根目录
 * @param options.srcCoolieConfigBaseDirname {String} 构建根目录
 * @returns {*}
 */
module.exports = function (file, options) {
    var code = options.code;

    code = code.replace(REG_SCRIPT, function (source, scriptTag, scriptCode) {
        var ignore = htmlAttr.get(source, COOLIE_IGNORE);
        var sourceOriginal = source;

        if (ignore) {
            source = htmlAttr.remove(source, COOLIE_IGNORE);
            return source;
        }

        var type = htmlAttr.get(scriptTag, 'type');
        var hasCoolie = htmlAttr.get(scriptTag, COOLIE);
        var src = htmlAttr.get(scriptTag, 'src');

        // 有 coolie 属性
        if (hasCoolie) {
            var dataMain = htmlAttr.get(source, 'data-main');
            var dataConfig = htmlAttr.get(source, 'data-config');

            if (!dataMain || dataMain === true) {
                debug.error('coolie script', path.toSystem(file));
                debug.error('coolie script', sourceOriginal);
                debug.error('coolie script', 'data-main is <Empty>');
            }

            if (!dataConfig || dataConfig === true) {
                debug.error('coolie script', path.toSystem(file));
                debug.error('coolie script', sourceOriginal);
                debug.error('coolie script', 'data-config is <Empty>');
            }

            source = htmlAttr.set(source, 'data-main', 'fix data-main');
            source = htmlAttr.set(source, 'data-config', 'fix data-config');
            source = htmlAttr.remove(source, COOLIE);
            source = source.replace(REG_LINE, '').replace(REG_SPACE, ' ');
            return source;
        }

        // 有 src 属性
        if (src) {
            return source;
        }

        var find = !type;

        if (!find) {
            dato.each(JS_TYPES, function (index, _type) {
                if (type === _type) {
                    find = true;
                    return false;
                }
            });
        }

        if (find) {
            scriptCode = minifyJS(file, {
                code: scriptCode
            });
        }

        var ret = scriptTag + scriptCode + '</script>';

        return ret.replace(REG_AMBIGUITY_SLICE, '}/**/}</script>');
    });

    return code;
};
