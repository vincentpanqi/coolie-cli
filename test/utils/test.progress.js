/**
 * 文件描述
 * @author ydr.me
 * @create 2016-04-07 12:05
 */


'use strict';

var progress = require('../../src/utils/progress.js');


describe('utils/progress.js', function () {
    it('run & stop', function (done) {
        var index = 1;

        while (index < 10000) {
            progress.run('测试', index);
            index++;
        }

        progress.stop('测试', '结束');
        done();
    });
});


