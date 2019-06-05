var cheerio = require('cheerio');
var slug = require('github-slugid');
var Config = require('./config.js');


/**
 * 处理toc相关，同时处理标题和id
 * @param $
 * @param option
 * @param page
 * @returns {Array} 返回处理好的tocs合集
 */
function handlerTocs($, page, modifyHeader) {
    var config = Config.config;
    var tocs = [];

    var count = {
        h1: 0,
        h2: 0,
        h3: 0,
        h4: 0,
        h5: 0,
        h6: 0
    };
    var titleCountMap = {}; // 用来记录标题出现的次数
    $(':header').each(function (i, elem) {
        var header = $(elem);
        var id = addId(header, titleCountMap);

        if (id) {
            switch (elem.tagName) {
                case "h1":
                    handlerH1Toc(config, count, header, tocs, page.level, modifyHeader);
                    break;
                case "h2":
                    handlerH2Toc(config, count, header, tocs, page.level, modifyHeader);
                    break;
                case "h3":
                    handlerH3Toc(config, count, header, tocs, page.level, modifyHeader);
                    break;
                case "h4":
                    handlerH4Toc(config, count, header, tocs, page.level, modifyHeader);
                    break;
                case "h5":
                    handlerH5Toc(config, count, header, tocs, page.level, modifyHeader);
                    break;
                case "h6":
                    handlerH6Toc(config, count, header, tocs, page.level, modifyHeader);
                    break;
                default:
                    titleAddAnchor(header, id);
                    break;
            }
        }
    });
    // 不然标题重写就没有效果，如果在外面不调用这句话的话
    page.content = $.html();
    return tocs;
}

/**
 * 处理锚点
 * @param header
 * @param titleCountMap 用来记录标题出现的次数
 * @returns {string}
 */
function addId(header, titleCountMap) {
    var id = header.attr('id') || slug(header.text());
    var titleCount = titleCountMap[id] || 0;
    titleCountMap[id] = titleCount + 1;
    // console.log('id:', id, 'n:', titleCount, 'hashmap:', titleCountMap)
    if (titleCount) {//此标题已经存在  null/undefined/0/NaN/ 表达式时，统统被解释为false
        id = id + '_' + titleCount;
    }
    header.attr("id", id);
    return id;
}

/**
 * 标题增加锚点效果
 * @param header
 * @param id
 */
function titleAddAnchor(header, id) {
    header.prepend('<a name="' + id + '" class="anchor-navigation-ex-anchor" '
        + 'href="#' + id + '">'
        + '<i class="fa fa-link" aria-hidden="true"></i>'
        + '</a>');
}

/**
 * 处理h1
 * @param count 计数器
 * @param header
 * @param tocs 根节点
 */
function handlerH1Toc(config, count, header, tocs, pageLevel, modifyHeader) {
    var title = header.text();
    var id = header.attr('id');
    var level = ''; //层级

    if (config.showLevel) {
        //层级显示仅在需要的时候处理
        count.h1 += 1;
        count.h2 = 0;
        count.h3 = 0;
        count.h4 = 0;
        count.h5 = 0;
        count.h6 = 0;
        if (config.multipleH1) {
            level = count.h1 + '. ';
        } else {
            level = ' ';
        }
        // 是否与官网默认主题层级序号相关联
        if (config.associatedWithSummary && config.themeDefault.showLevel) {
            level = pageLevel + '.' + level;
        }
        if (!modifyHeader) {
            level  = '';
        }
        header.text(level + title); //重写标题
    }
    titleAddAnchor(header, id);
    tocs.push({
        name: title,
        level: level,
        url: id,
        children: []
    });
}

/**
 * 处理h2
 * @param count 计数器
 * @param header
 */
function handlerH2Toc(config, count, header, tocs, pageLevel, modifyHeader) {
    var title = header.text();
    var id = header.attr('id');
    var level = ''; //层级

    if (tocs.length <= 0) {
        //一级节点为空时，生成一个空的一级节点，让二级节点附带在这个上面
        // 在显示层级的时候不乱
        if (config.showLevel) {
            count.h1 += 1;
        }
        tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }

    var h1Index = tocs.length - 1;
    var h1Toc = tocs[h1Index];
    if (config.showLevel) {
        count.h2 += 1;
        count.h3 = 0;
        count.h4 = 0;
        count.h5 = 0;
        count.h6 = 0;
        if (config.multipleH1) {
            level = (count.h1 + '.' + count.h2 + '. ');
        } else {
            level = (count.h2 + '. ');
        }
        if (config.associatedWithSummary && config.themeDefault.showLevel) {
            level = pageLevel + '.' + level;
        }
        if (!modifyHeader) {
            level  = '';
        }
        header.text(level + title); //重写标题
    }
    titleAddAnchor(header, id);
    h1Toc.children.push({
        name: title,
        level: level,
        url: id,
        children: []
    });
}

/**
 * 处理h3
 * @param count 计数器
 * @param header
 */
function handlerH3Toc(config, count, header, tocs, pageLevel, modifyHeader) {
    var title = header.text();
    var id = header.attr('id');
    var level = ''; //层级

    if (tocs.length <= 0) {
        //一级节点为空时，生成一个空的一级节点，让二级节点附带在这个上面
        if (config.showLevel) {
            count.h1 += 1;
        }
        tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h1Index = tocs.length - 1;
    var h1Toc = tocs[h1Index];
    var h2Tocs = h1Toc.children;
    if (h2Tocs.length <= 0) {
        //二级节点为空时，生成一个空的二级节点，让三级节点附带在这个上面
        if (config.showLevel) {
            count.h2 += 1;
        }
        h2Tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h2Toc = h1Toc.children[h2Tocs.length - 1];

    if (config.showLevel) {
        count.h3 += 1;
        count.h4 = 0;
        count.h5 = 0;
        count.h6 = 0;
        if (config.multipleH1) {
            level = (count.h1 + '.' + count.h2 + '.' + count.h3 + '. ');
        } else {
            level = (count.h2 + '.' + count.h3 + '. ');
        }
        if (config.associatedWithSummary && config.themeDefault.showLevel) {
            level = pageLevel + "." + level;
        }
        if (!modifyHeader) {
            level  = '';
        }
        header.text(level + title); //重写标题
    }
    titleAddAnchor(header, id);
    h2Toc.children.push({
        name: title,
        level: level,
        url: id,
        children: []
    });
}


/**
 * 处理h4
 * @param count 计数器
 * @param header
 */
function handlerH4Toc(config, count, header, tocs, pageLevel, modifyHeader) {
    var title = header.text();
    var id = header.attr('id');
    var level = ''; //层级

    if (tocs.length <= 0) {
        //一级节点为空时，生成一个空的一级节点，让二级节点附带在这个上面
        if (config.showLevel) {
            count.h1 += 1;
        }
        tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h1Toc = tocs[tocs.length - 1];

    var h2Tocs = h1Toc.children;
    if (h2Tocs.length <= 0) {
        //二级节点为空时，生成一个空的二级节点，让三级节点附带在这个上面
        if (config.showLevel) {
            count.h2 += 1;
        }
        h2Tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h2Toc = h1Toc.children[h2Tocs.length - 1];

    var h3Tocs = h2Toc.children;
    if (h3Tocs.length <= 0) {
        //二级节点为空时，生成一个空的二级节点，让三级节点附带在这个上面
        if (config.showLevel) {
            count.h3 += 1;
        }
        h3Tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h3Toc = h2Toc.children[h3Tocs.length - 1];

    if (config.showLevel) {
        count.h4 += 1;
        count.h5 = 0;
        count.h6 = 0;
        if (config.multipleH1) {
            level = (count.h1 + '.' + count.h2 + '.' + count.h3 + '.' + count.h4 + '. ');
        } else {
            level = (count.h2 + '.' + count.h3 + '.' + count.h4 + '. ');
        }
        if (config.associatedWithSummary && config.themeDefault.showLevel) {
            level = pageLevel + "." + level;
        }
        if (!modifyHeader) {
            level  = '';
        }
        header.text(level + title); //重写标题
    }
    titleAddAnchor(header, id);
    h3Toc.children.push({
        name: title,
        level: level,
        url: id,
        children: []
    });
}

/**
 * 处理h5
 * @param count 计数器
 * @param header
 */
function handlerH5Toc(config, count, header, tocs, pageLevel, modifyHeader) {
    var title = header.text();
    var id = header.attr('id');
    var level = ''; //层级

    if (tocs.length <= 0) {
        //一级节点为空时，生成一个空的一级节点，让二级节点附带在这个上面
        if (config.showLevel) {
            count.h1 += 1;
        }
        tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h1Toc = tocs[tocs.length - 1];

    var h2Tocs = h1Toc.children;
    if (h2Tocs.length <= 0) {
        //二级节点为空时，生成一个空的二级节点，让三级节点附带在这个上面
        if (config.showLevel) {
            count.h2 += 1;
        }
        h2Tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h2Toc = h1Toc.children[h2Tocs.length - 1];

    var h3Tocs = h2Toc.children;
    if (h3Tocs.length <= 0) {
        //二级节点为空时，生成一个空的二级节点，让三级节点附带在这个上面
        if (config.showLevel) {
            count.h3 += 1;
        }
        h3Tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h3Toc = h2Toc.children[h3Tocs.length - 1];

    var h4Tocs = h3Toc.children;
    if (h4Tocs.length <= 0) {
        //二级节点为空时，生成一个空的二级节点，让三级节点附带在这个上面
        if (config.showLevel) {
            count.h4 += 1;
        }
        h4Tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h4Toc = h3Toc.children[h4Tocs.length - 1];

    if (config.showLevel) {
        count.h5 += 1;
        count.h6 = 0;
        if (config.multipleH1) {
            level = (count.h1 + '.' + count.h2 + '.' + count.h3 + '.' + count.h4 + '.' + count.h5 + '. ');
        } else {
            level = (count.h2 + '.' + count.h3 + '.' + count.h4 + '.' + count.h5 + '. ');
        }
        if (config.associatedWithSummary && config.themeDefault.showLevel) {
            level = pageLevel + "." + level;
        }
        if (!modifyHeader) {
            level  = '';
        }
        header.text(level + title); //重写标题
    }
    titleAddAnchor(header, id);
    h4Toc.children.push({
        name: title,
        level: level,
        url: id,
        children: []
    });
}

/**
 * 处理h6
 * @param count 计数器
 * @param header
 */
function handlerH6Toc(config, count, header, tocs, pageLevel, modifyHeader) {
    var title = header.text();
    var id = header.attr('id');
    var level = ''; //层级

    if (tocs.length <= 0) {
        //一级节点为空时，生成一个空的一级节点，让二级节点附带在这个上面
        if (config.showLevel) {
            count.h1 += 1;
        }
        tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h1Toc = tocs[tocs.length - 1];

    var h2Tocs = h1Toc.children;
    if (h2Tocs.length <= 0) {
        //二级节点为空时，生成一个空的二级节点，让三级节点附带在这个上面
        if (config.showLevel) {
            count.h2 += 1;
        }
        h2Tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h2Toc = h1Toc.children[h2Tocs.length - 1];

    var h3Tocs = h2Toc.children;
    if (h3Tocs.length <= 0) {
        //二级节点为空时，生成一个空的二级节点，让三级节点附带在这个上面
        if (config.showLevel) {
            count.h3 += 1;
        }
        h3Tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h3Toc = h2Toc.children[h3Tocs.length - 1];

    var h4Tocs = h3Toc.children;
    if (h4Tocs.length <= 0) {
        //二级节点为空时，生成一个空的二级节点，让三级节点附带在这个上面
        if (config.showLevel) {
            count.h4 += 1;
        }
        h4Tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h4Toc = h3Toc.children[h4Tocs.length - 1];

    var h5Tocs = h4Toc.children;
    if (h5Tocs.length <= 0) {
        //二级节点为空时，生成一个空的二级节点，让三级节点附带在这个上面
        if (config.showLevel) {
            count.h5 += 1;
        }
        h5Tocs.push({
            name: "",
            level: "",
            url: "",
            children: []
        });
    }
    var h5Toc = h4Toc.children[h5Tocs.length - 1];

    if (config.showLevel) {
        count.h6 += 1;
        if (config.multipleH1) {
            level = (count.h1 + '.' + count.h2 + '.' + count.h3 + '.' + count.h4 + '.' + count.h5 + '.' + count.h6 + '. ');
        } else {
            level = (count.h2 + '.' + count.h3 + '.' + count.h4 + '.' + count.h5 + '.' + count.h6 + '. ');
        }
        if (config.associatedWithSummary && config.themeDefault.showLevel) {
            level = pageLevel + "." + level;
        }
        if (!modifyHeader) {
            level  = '';
        }
        header.text(level + title); //重写标题
    }
    titleAddAnchor(header, id);
    h5Toc.children.push({
        name: title,
        level: level,
        url: id,
        children: []
    });
}

/**
 * 处理浮动导航：拼接锚点导航html，并添加到html末尾，利用css 悬浮
 * @param tocs
 * @returns {string}
 */
function handlerFloatNavbar($, tocs) {
    var config = Config.config;
    var float = config.float;
    var floatIcon = float.floatIcon;
    var level1Icon = '';
    var level2Icon = '';
    var level3Icon = '';
    if (float.showLevelIcon) {
        level1Icon = float.level1Icon;
        level2Icon = float.level2Icon;
        level3Icon = float.level3Icon;
    }

    var html = "<div id='anchor-navigation-ex-navbar'><i class='" + floatIcon + "'></i><ul>";
    for (var i = 0; i < tocs.length; i++) {
        var h1Toc = tocs[i];
        if (h1Toc.name){
            html += "<li><span class='title-icon " + level1Icon + "'></span><a href='#" + h1Toc.url + "'><b>" + h1Toc.level + "</b>" + h1Toc.name + "</a></li>";
        }
        if (h1Toc.children.length > 0) {
            html += "<ul>"
            for (var j = 0; j < h1Toc.children.length; j++) {
                var h2Toc = h1Toc.children[j];
                if(h2Toc.name){
                    html += "<li><span class='title-icon " + level2Icon + "'></span><a href='#" + h2Toc.url + "'><b>" + h2Toc.level + "</b>" + h2Toc.name + "</a></li>";
                }
                if (h2Toc.children.length > 0) {
                    html += "<ul>";
                    for (var k = 0; k < h2Toc.children.length; k++) {
                        var h3Toc = h2Toc.children[k];
                        if(h3Toc.name) {
                            html += "<li><span class='title-icon " + level3Icon + "'></span><a href='#" + h3Toc.url + "'><b>" + h3Toc.level + "</b>" + h3Toc.name + "</a></li>";
                        }
                        if(h3Toc.children.length > 0) {
                            html += "<ul>";
                            for(var l = 0; l < h3Toc.children.length; l++) {
                                var h4Toc = h3Toc.children[l];
                                if(h4Toc.name) {
                                    html += "<li><a href='#" + h4Toc.url + "'><b>" + h4Toc.level + "</b>" + h4Toc.name + "</a></li>";
                                }
                                if(h4Toc.children.length > 0) {
                                    html += "<ul>";
                                    for(var m = 0; m < h4Toc.children.length; m++) {
                                        var h5Toc = h4Toc.children[m];
                                        if(h5Toc.name) {
                                            html += "<li><a href='#" + h5Toc.url + "'><b>" + h5Toc.level + "</b>" + h5Toc.name + "</a></li>";
                                        }
                                        if(h5Toc.children.length > 0) {
                                            html += "<ul>";
                                            for(var n = 0; n < h5Toc.children.length; n++) {
                                                var h6Toc = h5Toc.children[n];
                                                if(h6Toc.name) {
                                                    html += "<li><a href='#" + h4Toc.url + "'><b>" + h4Toc.level + "</b>" + h4Toc.name + "</a></li>";
                                                }
                                            }
                                            html += "</ul>";
                                        }
                                    }
                                    html += "</ul>";
                                }
                            }
                            html += "</ul>";
                        }
                    }
                    html += "</ul>";
                }
            }
            html += "</ul>"
        }
    }
    html += "</ul></div>";
    return html;
}

function handlerPageTopNavbar($, tocs) {
    return buildTopNavbar($, tocs)
}

function buildTopNavbar($, tocs) {
    var config = Config.config;
    var pageTop = config.pageTop;
    var level1Icon = '';
    var level2Icon = '';
    var level3Icon = '';
    if (pageTop.showLevelIcon) {
        level1Icon = pageTop.level1Icon;
        level2Icon = pageTop.level2Icon;
        level3Icon = pageTop.level3Icon;
    }

    var html = "<div id='anchor-navigation-ex-pagetop-navbar'><ul>";
    for (var i = 0; i < tocs.length; i++) {
        var h1Toc = tocs[i];
        if(h1Toc.name){
            html += "<li><span class='title-icon " + level1Icon + "'></span><a href='#" + h1Toc.url + "'><b>" + h1Toc.level + "</b>" + h1Toc.name + "</a></li>";
        }
        if (h1Toc.children.length > 0) {
            html += "<ul>"
            for (var j = 0; j < h1Toc.children.length; j++) {
                var h2Toc = h1Toc.children[j];
                if(h2Toc.name){
                    html += "<li><span class='title-icon " + level2Icon + "'></span><a href='#" + h2Toc.url + "'><b>" + h2Toc.level + "</b>" + h2Toc.name + "</a></li>";
                }
                if (h2Toc.children.length > 0) {
                    html += "<ul>";
                    for (var k = 0; k < h2Toc.children.length; k++) {
                        var h3Toc = h2Toc.children[k];
                        html += "<li><span class='title-icon " + level3Icon + "'></span><a href='#" + h3Toc.url + "'><b>" + h3Toc.level + "</b>" + h3Toc.name + "</a></li>";
                    }
                    html += "</ul>";
                }
            }
            html += "</ul>"
        }
    }

    html += "</ul></div>";

    return html;
}

/**
 * 添加返回顶部按钮
 * @param tocs
 * @returns {string}
 */
function buildGoTop(tocs) {
    var config = Config.config;
    var html = "";
    if (config.showGoTop && tocs && tocs.length > 0) {
        html = "<a href='#" + tocs[0].url + "' id='anchorNavigationExGoTop'><i class='fa fa-arrow-up'></i></a>";
    }
    return html;
}

function start(bookIns, page) {
    var $ = cheerio.load(page.content);
    var modifyHeader = !/<!--[ \t]*ex_nolevel[ \t]*-->/.test(page.content)

    // 处理toc相关，同时处理标题和id
    var tocs = handlerTocs($, page, modifyHeader);

    // 设置处理之后的内容
    if (tocs.length == 0) {
        page.content = $.html();
        return;
    }
    var html = "";
    if (!/<!--[ \t]*ex_nonav[ \t]*-->/.test(page.content)) {
        var config = Config.config;
        var mode = config.mode;
        if (mode == 'float') {
            html = handlerFloatNavbar($, tocs);
        } else if (mode == 'pageTop') {
            html = handlerPageTopNavbar($, tocs);
        }
    }
    html += buildGoTop(tocs);
    page.content = html + $.html();
    var $x = cheerio.load(page.content);
    $x('extoc').replaceWith($x(buildTopNavbar($, tocs, page)));
    page.content = $x.html();
}

module.exports = start;
