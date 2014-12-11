/*!
 * html 文件的内容替换
 * @author ydr.me
 * @create 2014-11-14 13:39
 */

'use strict';

var path = require('path');
var ydrUtil = require('ydr-util');
var dato = require('ydr-util').dato;
var log = require('./log.js');
var cssminify = require('./cssminify.js');
var htmlminify = require('./htmlminify.js');
var REG_BEGIN = /<!--\s*?coolie\s*?-->/ig;
var REG_END = /<!--\s*?\/coolie\s*?-->/i;
var REG_LINK = /<link\b[^>]*?\bhref\b\s*?=\s*?['"](.*?)['"][^>]*?>/g;
var REG_SCRIPT = /<script\b([^>]*?)\bsrc\b\s*?=\s*?['"](.*?)['"]([^>]*?)><\/script>/gi;
var REG_COOLIE = /<!--\s*?coolie\s*?-->([\s\S]*?)<!--\s*?\/coolie\s*?-->/gi;
var REG_ABSOLUTE = /^\//;
// 相同的组合只产生出一个文件
var concatMap = {};


/**
 * 提取 CSS 依赖并合并依赖
 * @param file {String} HTML 文件路径
 * @param data {String} HTML 文件内容
 * @param srcPath {String} 源路径
 * @param cssPath {String} 生成CSS文件路径
 * @param cssHost {String} CSS 根目录
 * @param jsHost {String} JS 根目录
 * @returns {{concat: Array, data: *}}
 */
module.exports = function (file, data, srcPath, cssPath, cssHost, jsHost) {
    var matches = data.split(REG_BEGIN);
    var concat = [];
    var replaceIndex = 0;
    var dirname = path.dirname(file);

    // 直接进行脚本路径替换，不需要额外操作
    data = data.replace(REG_SCRIPT, function ($0, $1, $2, $3) {
        var file;

        if (REG_ABSOLUTE.test($2)) {
            file = path.join(srcPath, $2);
        } else {
            file = path.join(dirname, $2);
        }

        var relative = path.relative(srcPath, file);
        var url = jsHost + dato.toURLPath(relative);

        return '<script' + $1 + 'src="' + url + '"' + $3 + '></script>';
    });

    // 循环匹配 <!--coolie-->(matched)<!--/coolie-->
    matches.forEach(function (matched) {
        var array = matched.split(REG_END);
        var link = array[0];
        var hrefMatches;
        var files = [];
        var md5List = '';
        var fileName;
        var filePath;
        var fileURL;
        var findMath = null;
        var file;
        var href;

        if (array.length === 2) {
            // <link href=".*">
            while ((hrefMatches = REG_LINK.exec(link))) {
                href = hrefMatches[1];

                if (REG_ABSOLUTE.test(href)) {
                    file = path.join(srcPath, href);
                } else {
                    file = path.join(dirname, href);
                }

                files.push(file);
                md5List += ydrUtil.crypto.etag(file);
            }
        }

        dato.each(concatMap, function (name, matched) {
            if (matched.files.length !== files.length) {
                return false;
            }

            var compare = dato.compare(matched.files, files);

            // 完全匹配
            if (compare && compare.different.length === 0) {
                findMath = dato.extend(true, {}, matched);
                return false;
            }
        });

        if (findMath) {
            filePath = path.join(cssPath, findMath.name);
            filePath = path.relative(srcPath, filePath);
            fileURL = cssHost + dato.toURLPath(filePath);
            findMath.url = fileURL;
            findMath.isRepeat = true;
            concat.push(findMath);
        } else {
            if (files.length) {
                fileName = ydrUtil.crypto.md5(md5List).slice(0, 8) + '.css';
                filePath = path.join(cssPath, fileName);
                filePath = path.relative(srcPath, filePath);
                fileURL = cssHost + dato.toURLPath(filePath);

                concat.push({
                    name: fileName,
                    url: fileURL,
                    file: path.join(dirname, filePath),
                    files: files
                });
                concatMap[fileName] = concat[concat.length - 1];
            }
        }
    });

    data = data.replace(REG_COOLIE, function ($0, $1) {
        return $1 ? '<link rel="stylesheet" href="' + concat[replaceIndex++].url + '"/>' : $0;
    });

    return {
        concat: concat,
        data: htmlminify(file, data)
    };
};

