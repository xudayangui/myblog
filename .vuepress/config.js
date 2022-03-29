const {getChildren} = require("./atuo")
module.exports = {
  "title": "myBlog",
  "description": "   ",
  "locales": {
    '/': {
      "lang": 'zh-CN'
    }
  },
  "base": "/myblog/",
  "dest": "dist",
  "head": [
    [
      "link",
      {
        "rel": "icon",
        "href": "/favicon.ico"
      }
    ],
    [
      "meta",
      {
        "name": "viewport",
        "content": "width=device-width,initial-scale=1,user-scalable=no"
      }
    ]
  ],
  "theme": "reco",
  "themeConfig": {
    "nav": [
      {
        "text": "主页",
        "link": "/",
        "icon": "reco-home"
      },
      {
        "text": "时间线",
        "link": "/timeline/",
        "icon": "reco-date"
      },
      {
        "text": "github",
        "icon": "reco-message",
        "link": "https://github.com/xudayangui",
      }
    ],
    "subSidebar": 'auto',//在所有页面中启用自动生成右侧边栏，原 sidebar 仍然兼容
    "sidebar": {
      "/docs/javascript/":  getChildren('./docs/javascript/'),
      "/docs/vue/": getChildren('./docs/vue/'),
    },
    "type": "blog",
    "blogConfig": {
      "category": {
        "location": 2,
        "text": "分类"
      },
      "tag": {
        "location": 3,
        "text": "标签"
      }
    },
    "logo": "/logo.png",
    "search": true,
    "searchMaxSuggestions": 10,
    "lastUpdated": "Last Updated",
    "author": "Dayangui",
    "authorAvatar": "/avatar.jpg",
    // "record": "xxxx",
    "startYear": "2017"
  },
  "markdown": {
    "lineNumbers": true
  }
}