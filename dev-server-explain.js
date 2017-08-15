//For detailed explanation on how things work, checkout the [guide](http://vuejs-templates.github.io/webpack/) and [docs for vue-loader](http://vuejs.github.io/vue-loader).
//http://blog.csdn.net/s8460049/article/details/54604322 another version of explaintion

// 导入check-versions.js文件，并且执行导入的函数，用来确定当前环境node和npm版本是否符合要求
// 关于check-versions请查看我博客check-versions的相关文章
require('./check-versions')()
// 导入config目录下的index.js配置文件，此配置文件中定义了生产和开发环境中所要用到的一些参数
// 关于index.js的文件解释请看我博客的index.js的相关文章
var config = require('../config')
// 下面表示如果如果没有定义全局变量NODE_ENV，则将NODE_ENV设置为"development"
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}
// opn插件是用来打开特定终端的，此文件用来在默认浏览器中打开链接 opn(url)
var opn = require('opn')
// nodejs路径模块
var path = require('path')
// nodejs开发框架express，用来简化操作，有兴趣可以自行去了解
var express = require('express')
// 引入webpack模块，用来使用webpack内置插件
var webpack = require('webpack')
// 引入http-proxy-middleware插件，此插件是用来代理请求的只能用于开发环境，目的主要是解决跨域请求后台api
var proxyMiddleware = require('http-proxy-middleware')
// 下面的意思是指，如果不是testing环境就引入webpack.dev.conf.js配置文件
// 关于webpack.dev.conf.js配置文件请关注我的相关文章，建议现在就去看，否则后面看着吃力
var webpackConfig = process.env.NODE_ENV === 'testing' ?
    require('./webpack.prod.conf') :
    require('./webpack.dev.conf')

// default port where dev server listens for incoming traffic
// 下面是webpack-dev-server 监听的端口号，因为没有设置process.env.PORT，所以下面监听的就是config.dev.port即8080
var port = process.env.PORT || config.dev.port
    // automatically open browser, if not set will be false
// 下面是true,至于为啥，本来就是true还要加!!两个感叹号，估计是vue作者装了个逼吧
var autoOpenBrowser = !!config.dev.autoOpenBrowser
    // Define HTTP proxies to your custom API backend
    // https://github.com/chimurai/http-proxy-middleware
// 下面是解决开发环境跨域问题的插件，我在config目录index.js文章中有介绍，自行查看
var proxyTable = config.dev.proxyTable
// 下面是创建node.js的express开发框架的实例，别问我为什么这样，自己看node.js去吧
var app = express()
// 把配置参数传递到webpack方法中，返回一个编译对象，这个编译对象上面有很多属性，自己去看吧，主要是用到里面的状态函数 如compilation，compile，after-emit这类的
var compiler = webpack(webpackConfig)
// 下面是webpack-dev-middleware和webpack-hot-middleware两兄弟，这两个是黄金组合
// 而vue作者用这两个插件也是用的最基本的形式，详情看(1) (2)
var devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    quiet: true  // 使用friendly-errors-webpack-plugin插件这个必须设置为true，具体看我的wepback-dev-config.js
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
        log: () => {} // 使用friendly-errors-webpack-plugin插件这个必须设置为true，具体看我的wepback-dev-config.js
    })
    // force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function(compilation) {
    // webpack任何一个插件都plugin这个方法，里面可以传递钩子函数，用来在插件各个阶段做特殊处理，钩子函数种类很多
    compilation.plugin('html-webpack-plugin-after-emit', function(data, cb) {
        // 当插件html-webpack-plugin产出完成之后，强制刷新浏览器
        hotMiddleware.publish({ action: 'reload' })
        cb()
    })
})

// proxy api requests
Object.keys(proxyTable).forEach(function(context) {
    // 下面是代理表的处理方法，看看就行了，几乎用不上，除非你是全栈，不用webpack-dev-server，使用后台语言做服务器
    var options = proxyTable[context]
    if (typeof options === 'string') {
        options = { target: options }
    }
    app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
// 这个插件是用来解决单页面应用，点击刷新按钮和通过其他search值定位页面的404错误
// 详情请看(3)
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
// app.use是在响应请求之前执行的，用来指定静态路径，挂载静态资源
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
// 下面的staticPath是 static ，path.posix.join其他配置文件中我已经介绍了，这里不再赘述
var staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
// 挂载静态资源，下面的方法是用虚拟目录来访问资源，staticPath就是虚拟目录路径，其实不管设不设置都是static
app.use(staticPath, express.static('./static'))
// 下面结果就是 'http://localhost:8080'
var uri = 'http://localhost:' + port

// 下面是es6的promise规范，用来处理嵌套请求的
var _resolve
var readyPromise = new Promise(resolve => {
    _resolve = resolve // resolve是一个回调函数专门用来传递成功请求的数据
})
// 下面是加载动画
console.log('> Starting dev server...')
// waitUntilValid是webpack-dev-middleware实例的方法，在编译成功之后调用
devMiddleware.waitUntilValid(() => {
    console.log('> Listening at ' + uri + '\n')
        // when env is testing, don't need open it
        // 测试环境不打开浏览器
    if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
        opn(uri)
    }
    _resolve() // 这里没有传递数据，这只是在模拟
})
// node.js监听端口
var server = app.listen(port)
// 这个导出对象是用来对外提供操作服务器和接受数据的接口，vue作者可谓考虑颇深啊
module.exports = {
    ready: readyPromise, // promise实例，可以通过readyPromise.then收到数据
    close: () => {
        server.close() // 关闭服务器
    }
}
解释

(1)webpack-dev-middleware插件
   这个插件只能用于开发环境，下面是这个插件的解释
   这是一个简洁的webpack包装中间件，这个插件做这个主要为文件做一件事情，就是当文件修改后提交到webpack服务器，然后处理这些修改后的文件
   这个插件有一下几个优点
   第一，所有的文件都是写在disk上，文件的处理在内存中进行
   第二，如果文件在watch模式下被改动，这个中间件将不会为这些老的bundle服务了，如果这些老的bundle上有文件改动，
         这个中间件将不会发送请求，而是等到当前编译结束，当前最新的文件有改动，才会发送请求，所以你不需要手动刷新了
   第三，我会在以后的版本中优化
   总结，这个中间件是webpack-dev-server的核心，实现修改文件，webapack自动刷新的功能
   安装 npm install webpack-deb-middleware --save-dev
   使用方法如下，下面的使用方法也是webpack-dev-server实现的代码
   var webpackMiddleware = require("webpack-deb-middleware");
   app.use(webpackMiddleware(webpack({obj1}),{obj2}))
   app.use是express的方法，用来设置静态路径
   上面的obj1是webpack配置对象，使用webpack方法转换成compiler编译对象，obj2配置的是更新文件打包后的配置，使用
   webpackMiddleware处理之后，就返回一个静态路径，方便获取文件关于obj2的配置项，可以自行查阅，必须要添加publicPath
   说到这里，我就不卖关子了，简言之
   我们的静态服务器是node.js，现在文件修改了，webpack-dev-middleware将修改的文件编译后，告诉nodejs服务器哪些文件修改了
   并且把最新的文件上传到静态服务器，够清楚了吧
(2)webpack-hot-middleware插件
   这个插件是用来将webpack-dev-middleware编译更新后的文件通知浏览器，并且告诉浏览器如何更新文件，从而实现 Webpack hot reloading
   将这两个插件配合起来使用你就可以不需要webpack-dev-sever，即可以自己实现hot-replacement热替换功能，
   webpack-hot-middleware插件通知浏览器更新文件大致是通过一个json对象实现的，具体实现机制这里不多说了，下面来看具体用法
   安装 npm install webpack-hot-middleware --save-dev
   在使用了webpack-dev-middleware之后，在添加如下代码即可
   app.use(require("webpack-hot-middleware")(compiler));
(3)connect-history-api-fallback插件
   因为在开发单页面应用时，总的来说项目就一个页面，如果通过点击刷新按钮并且此时链接指的不是主页的地址，就会404；或者我通过其他的链接比如 /login.html 但是并没有login.html就会报错
   而这个插件的作用就是当有不正当的操作导致404的情况，就把页面定位到默认的index.html
   使用起来也比较简单，记住这样用就可以了
   安装 npm install --save connect-history-api-fallback
   使用 var history = require('connect-history-api-fallback');
   var express = require('express');
   var app = express();
   app.use(history());
