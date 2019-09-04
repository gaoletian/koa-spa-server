const path = require("path");
const koa = require("koa");
const statics = require("./koa-static");
const compress = require("koa-compress");
const rewrite = require("./koa-rewrite");
const koaproxy = require("./koa-proxy");
const L = require("nirvana-logger")("spa-server");
const _ = require("lodash");
const nirvanaOauth = require("nirvana-oauth");
const logger = require("koa-logger");
const defaultOption = {
  // 静态目录
  webRoot: {
    prefix: "/",
    root: path.join(__dirname, "./dist")
  },
  // 健康检查
  healthCheck: true,
  // 单页应用
  fallback: true,
  // fallback 选项
  fallbackOption: {
    logger: L
  },
  // 服务端口
  port: process.env.PORT0 || 7002,
  // 启用压缩
  compress: {
    filter(content_type) {
      return /text|javascript|html|css/i.test(content_type);
    },
    threshold: 2048,
    flush: require("zlib").Z_SYNC_FLUSH
  }
};

class SpaServer {
  constructor(option = {}) {
    this.option = _.merge({}, defaultOption, option);
    this.app = new koa();
    this.middlewares = [];
  }

  async init() {
    const { app, option } = this;
    // request logger
    app.use(
      logger(str => {
        L(str);
      })
    );

    // 压缩
    if (this.option.compress) {
      app.use(compress(this.option.compress));
    }

    // 代理
    if (option.proxyTable) {
      setProxy(app, option.proxyTable);
    }

    // 健康检查
    if (option.healthCheck) {
      app.use(function(ctx, next) {
        if (!["/health", "/healthcheck"].includes(ctx.req.url.toLowerCase()))
          return next();
        ctx.status = 200;
        ctx.body = "server aliving";
      });
    }

    if (option.oAuth) {
      // 初始化时触发获取 token
      this.bearerToken = await nirvanaOauth.getBearerToken(option.oAuth);
      koaproxy.setProxyEvent("proxyReq", async proxyReq => {
        proxyReq.setHeader("Authorization", this.bearerToken);
        // 重要！！！ 在处理每个代理请求时也需要 触发获取 token
        this.bearerToken = await nirvanaOauth.getBearerToken(option.oAuth);
        // L('bearerToken =', this.bearerToken )
      });
    }

    // url重写
    if (option.fallback) {
      const opt = Object.assign({ verbose: false }, option.fallbackOption);
      app.use(rewrite(opt));
    }

    // 静态资源
    if (option.webRoot) {
      this.setStatic(option.webRoot);
    }
  }

  // 中间件
  use(fn) {
    this.middlewares.push(fn);
  }

  // 静态目录
  setStatic(webRoot) {
    const { root } = webRoot;
    const opt = Object.assign({}, webRoot);
    delete opt.root;
    this.app.use(statics(root, opt));
  }

  // 代理事件
  setProxyEvent(event, eventHandle) {
    koaproxy.setProxyEvent(event, eventHandle);
  }

  // 启动服务
  async start() {
    const { option, app } = this;
    // 初始化
    await this.init();
    // 启动服务
    app.listen(option.port);
    L("服务已启动", option.port);
  }
}

// 设置代理
function setProxy(app, proxyTable) {
  if (typeof proxyTable !== "object")
    throw new Error("proxyTable must be jsobject");

  Object.keys(proxyTable).forEach(item => {
    let options = proxyTable[item];
    if (typeof options === "string") {
      options = {
        target: options,
        changeOrigin: true,
        logs: true
      };
    }
    // 应用代理中间件
    app.use(koaproxy.proxy(item, options));
  });
}

module.exports = SpaServer;
