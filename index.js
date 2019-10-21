var _start = require('./assets/lib/plugin');
var Config = require('./assets/lib/config');
var fs = require("fs");
require('./assets/lib/log');

var os = require('os');
var path = require('path');


// 缓存结果，加速
// __doc__: {$path: {content: "编译后的内容", mtimeMs: "mtimeMs相同，表示不需要重新编译"}}
var cached = {};
var cache_file = path.join(os.tmpdir(), 'anchor-navigation-ex.cache.json');
if(fs.existsSync(cache_file)){
    cached = JSON.parse(fs.readFileSync(cache_file));
}


module.exports = {
    book: {
        assets: "./assets",
        css: ["style/plugin.css"]
    },
    hooks: {
        "init": function () {
            Config.handlerAll(this);
        },
        "page": function (page) {
            var file_stat = fs.statSync(page.rawPath);
            var cached_stat = cached[page.rawPath] || {};

            // 有缓存，直接返回缓存的结果
            if(cached_stat.mtimeMs == file_stat.mtimeMs) {
                page.content = cached_stat.content;
                return page;
            }

            if (Config.config.printLog) {
                console.info("INFO:".info + "正在生成导航目录:" + page.path)
            }

            var bookIns = this;
            _start(bookIns, page);

            cached_stat.mtimeMs = file_stat.mtimeMs;
            cached_stat.content = page.content;
            cached[page.rawPath] = cached_stat;
            fs.writeFileSync(cache_file, JSON.stringify(cached, null, 4));

            return page;
        }
    }
};
