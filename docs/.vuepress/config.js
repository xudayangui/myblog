module.exports = {
    // 左上角标题
    title: 'Dayangui',
    //描述
    description: '我的个人博客',
    // 头部部署，右上角小图标
    head: [['link', {rel: 'icon'}]],
    base: '/myblog/',// 部署时指定存放的项目的地址
    //插件
    plugins: ['@vuepress/back-to-top'],
    lastUpdated: '最后更新',
    // 主题部署
    themeConfig: {
        nav: [
            {text: '主页',link: '/'},
            {text: '关于',link: '/about/'},
        ],
        /**
         * 侧边栏配置：侧边栏组
         */
        sidebarDepth: 0,
        sidebar:{
            '/notes/':[
                {
                    title: 'JavaScript', // 侧边栏名称
                    collapsable: false, // 可折叠
                    children: [
                        ['/notes/javascript/手动实现Ajax','手动实现Ajax'],
                        ['/notes/javascript/ES6新特性','ES6新特性'],
                        ['/notes/javascript/原型与原型链','原型与原型链'],
                        ['/notes/javascript/闭包','闭包'],
                        ['/notes/javascript/变量提升','变量提升'],
                        ['/notes/javascript/匿名函数与自执行函数','匿名函数与自执行函数'],
                        ['/notes/javascript/apply、call、bind','apply、call、bind'],
                        ['/notes/javascript/事件冒泡及阻止','事件冒泡及阻止'],
                        ['/notes/javascript/JS事件流模型','JS事件流模型'],
                        ['/notes/javascript/函数声明与函数表达式','函数声明与函数表达式'],
                        ['/notes/javascript/JS中this的指向','JS中this的指向'],
                        ['/notes/javascript/new运算符','new运算符'],
                        ['/notes/javascript/Js遍历数组总结','Js遍历数组总结'],
                        ['/notes/javascript/Promise对象','Promise对象'],
                        ['/notes/javascript/async、await','async、await'],
                        ['/notes/javascript/Generator函数','Generator函数'],
                        ['/notes/javascript/==与===','==与==='],
                        ['/notes/javascript/Js选择器','Js选择器'],
                        ['/notes/javascript/Js模块化导入导出','Js模块化导入导出'],
                        ['/notes/javascript/let与const','let与const'],
                        ['/notes/javascript/作用域与作用域链','作用域与作用域链'],
                        ['/notes/javascript/Js异步机制','Js异步机制'],
                        ['/notes/javascript/Js继承的实现方式','Js继承的实现方式'],
                        ['/notes/javascript/Function与Object','Function与Object'],
                        ['/notes/javascript/Js严格模式','Js严格模式'],
                        ['/notes/javascript/Js箭头函数','Js箭头函数'],
                        ['/notes/javascript/手动实现apply、call、bind','手动实现apply、call、bind'],
                        ['/notes/javascript/Js遍历对象总结','Js遍历对象总结'],
                        ['/notes/javascript/Js获取数据类型','Js获取数据类型'],
                        ['/notes/javascript/手动实现Promise','手动实现Promise'],
                        ['/notes/javascript/数组排序','数组排序'],
                        ['/notes/javascript/defineProperty','defineProperty'],
                        ['/notes/javascript/Js实现链表操作','Js实现链表操作'],
                        ['/notes/javascript/getter与setter','getter与setter'],
                        ['/notes/javascript/防抖与节流','防抖与节流'],
                        ['/notes/javascript/实现浅拷贝与深拷贝','实现浅拷贝与深拷贝'],
                        ['/notes/javascript/Map与WeakMap','Map与WeakMap'],
                        ['/notes/javascript/Set与WeakSet','Set与WeakSet'],
                        ['/notes/javascript/Object对象','Object对象'],
                        ['/notes/javascript/Js中fetch方法','Js中fetch方法'],
                        ['/notes/javascript/XML和JSON的比较','XML和JSON的比较'],
                    ]
                },
                {
                    title: 'vue', // 侧边栏名称
                    collapsable: false, // 可折叠
                    children: [
                        ['/notes/vue/VuePress打造静态博客','VuePress打造静态博客'],
                    ]
                },
            ]
        }
    }
}