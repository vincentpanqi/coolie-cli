/**
 * html 压缩
 * @author ydr.me
 * @create 2015-10-22 16:16
 */


'use strict';


var dato = require('ydr-utils').dato;
var random = require('ydr-utils').random;

var sign = require('../utils/sign.js');

// 替换 <img src="">
var replaceHTMLAttrResource = require('../replace/html-attr-resource.js');
// 替换 <script src>
var replaceHTMLTagScriptAttr = require('../replace/html-tag-script-attr.js');
var replaceHTMLTagScriptCoolie = require('../replace/html-tag-script-coolie.js');
var replaceHTMLTagScriptContent = require('../replace/html-tag-script-content.js');
// 替换 <link>
var replaceHTMLTagLink = require('../replace/html-tag-link.js');
// 替换 <style>
var replaceHTMLTagStyleResource = require('../replace/html-tag-style-resource.js');
// 替换 <div style=""
var replaceHTMLAttrStyleResource = require('../replace/html-attr-style-resource.js');
// 替换 <!--coolie-->...<!--/coolie-->
var replaceHTMLCoolieGroup = require('../replace/html-coolie-group.js');

var reLineBreak = /[\n\r]/g;
var reContinuousBlank = /\s{2,}|\t/g;
// 单行注释
var reOneLineComments = /<!--.*?-->/g;
// 多行注释
var reMultipleLinesComments = /<!--.*\n(.*\n)+?.*-->/g;
var reCoolieComments = /<!--\s*?coolie\s*?-->[\s\S]*?<!--\s*?\/coolie\s*?-->/gi;
var rePreTagname = /<(textarea|pre|code|style|script)\b[\s\S]*?>[\s\S]*?<\/\1>/gi;
var reConditionsCommentsStarts = [
    /<!--\[(if|else if|else).*]><!-->/gi,
    /<!--\[(if|else if|else).*]>/gi
];
var reConditionsCommentsEnds = [
    /<!--<!\[endif]-->/gi,
    /<!\[endif]-->/gi
];
var reConditionsComments = /<!--\[(if|else if).*?]>([\s\S]*?)<!\[endif]-->/gi;
var defaults = {
    code: '',
    removeHTMLMultipleLinesComments: true,
    removeHTMLOneLineComments: true,
    joinHTMLSpaces: true,
    removeHTMLBreakLines: true,
    versionLength: 32,
    srcDirname: null,
    destDirname: null,
    destJSDirname: null,
    destCSSDirname: null,
    destResourceDirname: null,
    destHost: '/',
    srcCoolieConfigBaseDirname: null,
    destCoolieConfigJSPath: null,
    minifyJS: true,
    minifyCSS: true,
    minifyResource: true,
    uglifyJSOptions: null,
    cleanCSSOptions: null,
    replaceCSSResource: true,
    mainVersionMap: null,
    signHTML: false,
    signJS: false,
    signCSS: false,
    mute: false
};

/**
 * html minify
 * @param file {String} 文件地址
 * @param options {Object} 配置
 * @param options.code {String} 代码
 * @param [options.removeHTMLMultipleLinesComments=true] {Boolean} 是否去除多行注释
 * @param [options.removeHTMLOneLineComments=true] {Boolean} 是否去除单行注释
 * @param [options.joinHTMLSpaces=true] {Boolean} 是否合并空白
 * @param [options.removeHTMLBreakLines=true] {Boolean} 是否删除断行
 * @param [options.versionLength=32] {Number} 版本号长度
 * @param [options.srcDirname] {String} 原始根目录
 * @param [options.destDirname] {String} 目标根目录
 * @param [options.destJSDirname] {String} 目标 JS 目录
 * @param [options.destCSSDirname] {String} 目标 CSS 目录
 * @param [options.destResourceDirname] {String} 目标资源目录
 * @param [options.destHost] {String} 目标域
 * @param [options.coolieConfigBase] {String} coolie-config:base 值
 * @param [options.srcCoolieConfigJSPath] {String} 原始 coolie-config.js 路径
 * @param [options.srcCoolieConfigBaseDirname] {String} 原始 coolie-config:base 目录
 * @param [options.destCoolieConfigJSPath] {String} 目标 coolie-config.js 路径
 * @param [options.minifyJS=true] {Boolean} 是否压缩 JS
 * @param [options.minifyCSS=true] {Boolean} 是否压缩 CSS
 * @param [options.minifyResource=true] {Boolean} 是否压缩引用资源
 * @param [options.uglifyJSOptions=null] {Boolean} 压缩 JS 配置
 * @param [options.cleanCSSOptions=null] {Boolean} 压缩 CSS 配置
 * @param [options.replaceCSSResource=true] {Boolean} 是否替换 css 引用资源
 * @param [options.mainVersionMap] {Object} 入口模块版本信息
 * @param [options.signHTML] {Boolean} 是否签名 html 文件
 * @param [options.signJS] {Boolean} 是否签名 js 文件
 * @param [options.signCSS] {Boolean} 是否签名 css 文件
 * @param [options.mute] {Boolean} 是否静音
 * @returns {Object}
 */
var minifyHTML = function (file, options) {
    options = dato.extend({}, defaults, options);
    var coolieMap = {};
    var preMap = {};
    var commentsMap = {};
    var code = options.code;
    var mainList = [];
    var jsList = [];
    var cssList = [];
    var resList = [];
    var replace = function (pack) {
        return function (source) {
            var key = _generateKey();
            var matchConditionsCommentsRet = matchConditionsComments(file, options, source);

            if (!matchConditionsCommentsRet.start || !matchConditionsCommentsRet.end) {
                pack[key] = source;
                return key;
            }

            var minifyConditionsCommentsRet = minifyConditionsComments(file, options, matchConditionsCommentsRet);

            pack[key] = minifyConditionsCommentsRet.code;
            mainList = mainList.concat(minifyConditionsCommentsRet.mainList);
            jsList = jsList.concat(minifyConditionsCommentsRet.jsList);
            cssList = cssList.concat(minifyConditionsCommentsRet.cssList);
            resList = resList.concat(minifyConditionsCommentsRet.resList);

            return key;
        };
    };

    // 保留 <!--coolie-->
    code = code.replace(reCoolieComments, replace(coolieMap));

    // 保留条件注释
    code = code.replace(reConditionsComments, replace(commentsMap));

    // 移除单行注释
    if (options.removeHTMLOneLineComments) {
        code = code.replace(reOneLineComments, '');
    } else {
        code = code.replace(reOneLineComments, replace(commentsMap));
    }

    // 移除多行注释
    if (options.removeHTMLMultipleLinesComments) {
        console.log(code.match(reMultipleLinesComments));
        code = code.replace(reMultipleLinesComments, '');
    } else {
        code = code.replace(reMultipleLinesComments, replace(commentsMap));
    }

    // 保留 pre tagName
    code = code.replace(rePreTagname, replace(preMap));

    // 合并长空白
    if (options.joinHTMLSpaces) {
        code = code.replace(reContinuousBlank, ' ');
    }

    // 移除多换行
    if (options.removeHTMLBreakLines) {
        code = code.replace(reLineBreak, '');
    }

    // 恢复 pre tagName
    dato.each(preMap, function (key, val) {
        code = code.replace(key, val);
    });


    // replace <img src="...">
    var replaceHTMLAttrResourceRet = replaceHTMLAttrResource(file, {
        code: code,
        versionLength: options.versionLength,
        srcDirname: options.srcDirname,
        destDirname: options.destDirname,
        destHost: options.destHost,
        destResourceDirname: options.destResourceDirname,
        minifyResource: options.minifyResource,
        mute: options.mute
    });

    code = replaceHTMLAttrResourceRet.code;
    resList = resList.concat(replaceHTMLAttrResourceRet.resList);


    // replace <script coolie>
    var replaceHTMLTagScriptCoolieRet = replaceHTMLTagScriptCoolie(file, {
        code: code,
        srcDirname: options.srcDirname,
        coolieConfigBase: options.coolieConfigBase,
        srcCoolieConfigJSPath: options.srcCoolieConfigJSPath,
        srcCoolieConfigBaseDirname: options.srcCoolieConfigBaseDirname,
        destDirname: options.destDirname,
        destHost: options.destHost,
        destJSDirname: options.destJSDirname,
        destCoolieConfigJSPath: options.destCoolieConfigJSPath,
        versionLength: options.versionLength,
        mainVersionMap: options.mainVersionMap,
        minifyJS: options.minifyJS,
        uglifyJSOptions: options.uglifyJSOptions,
        signJS: options.signJS,
        mute: options.mute
    });

    code = replaceHTMLTagScriptCoolieRet.code;
    mainList = mainList.concat(replaceHTMLTagScriptCoolieRet.mainList);
    jsList = jsList.concat(replaceHTMLTagScriptCoolieRet.jsList);


    // replace <script>
    var replaceHTMLTagScriptAttrRet = replaceHTMLTagScriptAttr(file, {
        code: code,
        srcDirname: options.srcDirname,
        destDirname: options.destDirname,
        destHost: options.destHost,
        destJSDirname: options.destJSDirname,
        versionLength: options.versionLength,
        mainVersionMap: options.mainVersionMap,
        minifyJS: options.minifyJS,
        uglifyJSOptions: options.uglifyJSOptions,
        signJS: options.signJS,
        mute: options.mute
    });

    code = replaceHTMLTagScriptAttrRet.code;
    jsList = jsList.concat(replaceHTMLTagScriptAttrRet.jsList);


    // replace <script>***</script>
    var replaceHTMLTagScriptContentRet = replaceHTMLTagScriptContent(file, {
        code: code,
        srcDirname: options.srcDirname,
        minifyJS: options.minifyJS,
        uglifyJSOptions: options.uglifyJSOptions,
        signJS: options.signJS,
        mute: options.mute
    });

    code = replaceHTMLTagScriptContentRet.code;
    jsList = jsList.concat(replaceHTMLTagScriptContentRet.jsList);


    // replace <link href="">
    var replaceHTMLTagLinkRet = replaceHTMLTagLink(file, {
        code: code,
        srcDirname: options.srcDirname,
        destDirname: options.destDirname,
        destHost: options.destHost,
        destCSSDirname: options.destCSSDirname,
        destResourceDirname: options.destResourceDirname,
        versionLength: options.versionLength,
        minifyCSS: options.minifyCSS,
        cleanCSSOptions: options.cleanCSSOptions,
        signCSS: options.signCSS,
        mute: options.mute
    });

    code = replaceHTMLTagLinkRet.code;
    cssList = cssList.concat(replaceHTMLTagLinkRet.cssList);


    // 恢复 coolie group
    dato.each(coolieMap, function (key, val) {
        code = code.replace(key, val);
    });


    // replace <!--coolie--> ... <!--/coolie-->
    var replaceHTMLCoolieGroupRet = replaceHTMLCoolieGroup(file, {
        code: code,
        destJSDirname: options.destJSDirname,
        cleanCSSOptions: options.cleanCSSOptions,
        versionLength: options.versionLength,
        srcDirname: options.srcDirname,
        destDirname: options.destDirname,
        destHost: options.destHost,
        destResourceDirname: options.destResourceDirname,
        destCSSDirname: options.destCSSDirname,
        minifyJS: options.minifyJS,
        uglifyJSOptions: options.uglifyJSOptions,
        minifyCSS: options.minifyCSS,
        replaceCSSResource: options.replaceCSSResource,
        signJS: options.signJS,
        signCSS: options.signCSS,
        mute: options.mute
    });

    code = replaceHTMLCoolieGroupRet.code;
    jsList = jsList.concat(replaceHTMLCoolieGroupRet.jsList);
    cssList = cssList.concat(replaceHTMLCoolieGroupRet.cssList);


    // replace <style>
    var replaceHTMLTagStyleResourceRet = replaceHTMLTagStyleResource(file, {
        code: code,
        versionLength: options.versionLength,
        srcDirname: options.srcDirname,
        destDirname: options.destDirname,
        destHost: options.destHost,
        destResourceDirname: options.destResourceDirname,
        minifyCSS: options.minifyCSS,
        cleanCSSOptions: options.cleanCSSOptions,
        minifyResource: options.minifyResource,
        mute: options.mute
    });

    code = replaceHTMLTagStyleResourceRet.code;
    resList = resList.concat(replaceHTMLTagStyleResourceRet.resList);


    // replace <div style="">
    var replaceHTMLAttrStyleResourceRet = replaceHTMLAttrStyleResource(file, {
        code: code,
        versionLength: options.versionLength,
        srcDirname: options.srcDirname,
        destDirname: options.destDirname,
        destHost: options.destHost,
        destResourceDirname: options.destResourceDirname,
        minifyResource: options.minifyResource,
        mute: options.mute
    });
    code = replaceHTMLAttrStyleResourceRet.code;
    resList = resList.concat(replaceHTMLAttrStyleResourceRet.resList);


    // 恢复注释
    dato.each(commentsMap, function (key, val) {
        code = code.replace(key, val);
    });

    if (options.signHTML) {
        code = code + '\n' + sign('html');
    }

    return {
        code: code,
        mainList: mainList,
        jsList: jsList,
        cssList: cssList,
        resList: resList
    };
};


/**
 * 匹配条件注释
 * @param file
 * @param options
 * @param source
 * @returns {{start: string, end: string, source: *}}
 */
var matchConditionsComments = function (file, options, source) {
    var start = '';
    dato.each(reConditionsCommentsStarts, function (index, reg) {
        start = (source.match(reg) || [''])[0];

        if (start) {
            source = source.replace(reg, '');
            return false;
        }

    });

    var end = '';
    dato.each(reConditionsCommentsEnds, function (index, reg) {
        end = (source.match(reg) || [''])[0];

        if (end) {
            source = source.replace(reg, '');
            return false;
        }
    });

    return {
        start: start,
        end: end,
        source: source
    };
};


/**
 * 压缩注释的 html
 * @param file
 * @param options
 * @param matched
 * @returns {*}
 */
function minifyConditionsComments(file, options, matched) {
    var source = matched.source;
    var start = matched.start;
    var end = matched.end;
    var options2 = dato.extend({}, options);

    options2.code = source;
    options2.signHTML = false;
    //code: code,
    //mainList: mainList,
    //jsList: jsList,
    //cssList: cssList,
    //resList: resList
    var realRet = minifyHTML(file, options2);
    realRet.code = start + realRet.code + end;
    return realRet;
}


/**
 * 生成随机唯一 KEY
 * @returns {string}
 * @private
 */
function _generateKey() {
    return '≤' + random.string(10, 'aA0') + random.guid() + '≥';
}


module.exports = minifyHTML;
