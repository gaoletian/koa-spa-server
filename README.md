# koa-spa-server 用法

```js
const path = require('path');
const koaServer = require('koa-spa-server');
// const L = require('nirvana-logger')('example');
const port = process.env.PORT0 || 7002;

const proxyTable = {
  '/api': {
    target: 'http://localhost:8000',
    changeOrigin: false,
    logs: true,
  },
  '/openapi': {
    target: 'http://localhost:8000',
    changeOrigin: false,
    logs: true,
  },
};

// 创建服务
const server = new koaServer({
  port,
  proxyTable,
  fallback: true,
});

// 静态目录
server.setStatic('/', path.join(__dirname, '.'));
// 启动服务
server.start();
```

## 选项配置

| 配置项 | 说明 |
| --- | --- |
| port | 服务端口，默认 7002
| webRoot | 静态资源配置选项  {prefix: '前辍', root: '静态资源的绝对路径', maxage: 0, index: 'index.html'}
| fallback | 是否启用 spa选项 默认 true
| fallbackOption | object url重写选项配置
| compress | 压缩选项，默认启用
| proxyTable | 代理配置，参考
| healthCheck | 健康检查， true or false, 默认为 true, 支持 /health /healthCheck 或 /healthcheck
| oAuth | object oAuth配置
| oAuth.url | string oAuth token url
| oAuth.client_id | string client_id
| oAuth.client_secret | string client_secret
| oAuth.expires | number  beartoken缓存时长，单位为秒 默认为 `1200` 秒

## webRoot配置项
- root     静态资源的绝对路径
- maxage   浏览器缓存 max-age 单位毫秒. 默认为 0 毫秒
- hidden   是否允许隐藏文件. 默认 false
- index    默认页 'index.html'
- defer    如果为 true 则允许下游中间件优先处理.
- gzip     如果为true 浏览器端支持gzip并且存在资源的.gz扩展默认为 true.
- prefix   url前辍,默认 '/'
- suffix   url后辍，默认 ''

## fallbackOption配置项
### index     
  索引页，默认为 'index.html'
### rewrites  url重写规则
  使用自定义url匹配模式覆盖index选项,例如：
```js
// fallbackOption配置项
{
    rewrites: [
            { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') },
            // { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') },
            { from: /^\/$/, to: '/index.html' },
            { from: /^\/(profile|app|work-order|config-server|instance|service|domain|log|oauth|cdn)/, to: '/profile.html' },
            { from: /^\/login/, to: '/login.html' },
            { from: /^\/user/, to: '/user.html' },
            { from: /^\/terminal/, to: '/terminal.html' },
            { from: /^\/docs/, to: '/docs.html' },
          ]
}
```

### verbose
是否打印url重写信息

```js
{
  verbose: true
}
```


## example

```js
// config.js

const path = require('path');

const targets = {
  openapi: {
    local: 'http://10.10.232.242:8000',
    test: 'http://10.10.232.242:8000',
    production: 'http://10.10.232.242:8000',
  },
  api: {
    local: 'http://10.10.232.242:9000',
    test: 'http://10.10.232.242:9000',
    production: 'http://10.10.232.242:9000',
  },
};

const env = process.env.NODE_ENV || 'local';

module.exports = {
  // 静态资源
  webRoot: {
    prefix: '/',
    root: path.join(__dirname, '../example'),
  },
  // url重写配置
  fallback: true,
  fallbackOption: {
    index: 'index.html',
    verbose: 'true',
    rewrites: [
        { from: /^\/$/, to: '/index.html' },
        { from: /^\/(profile|app|work-order|config-server|instance|service|domain|log|oauth|cdn)/, to: '/profile.html' },
        { from: /^\/login/, to: '/login.html' },
        { from: /^\/user/, to: '/user.html' },
        { from: /^\/terminal/, to: '/terminal.html' },
        { from: /^\/docs/, to: '/docs.html' },
    ]
  },
  // 代理配置
  proxyTable: {
    '/api/rong360': {
      target: targets.openapi[env],
      changeOrigin: true,
      logs: true,
      pathRewrite: path => path.replace('\/api\/', '\/'),
    },
    '/openapi': {
      target: targets.openapi[env],
      changeOrigin: true,
      pathRewrite: path => path.replace('\/openapi\/', '\/'),
    },
    '/api/(user|internal|bank|repay|payment|account|location|creditItem)': {
      target: targets.api[env],
      changeOrigin: true,
      logs: true,
      pathRewrite: path => path.replace('\/api\/', '\/puhui-nirvana-user\/'),
    },
    '/api/risk': {
      target: targets.api[env],
      changeOrigin: true,
      pathRewrite: path => path.replace('\/api\/risk/', '\/puhui-holmes-risk-assess/api/v2/'),
    },
    '/api/assets': {
      target: targets.api[env],
      changeOrigin: true,
      pathRewrite: path => path.replace('\/api\/assets\/', '\/puhui-core-server-cloud/api/'),
    },
  },
};
```


> 关于代理
>
> http://forbeslindesay.github.io/express-route-tester/
> https://github.com/component/path-to-regexp
>
> 路径正则验证
>
> http://forbeslindesay.github.io/express-route-tester/

## 实例方法

- setStatics({prefix, root})

	设置静态资源

- start()

	启动服务




