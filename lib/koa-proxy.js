/**
 * Created by 高乐天 on 17/7/14.
 */

const HttpProxy = require('http-proxy');
const pathMatch = require('path-match');
const L = require('nirvana-logger')('proxy');

/**
 * Constants
 */

const proxy = HttpProxy.createProxyServer();
const route = pathMatch({
  // path-to-regexp options
  sensitive: false,
  strict: false,
  end: false,
});

module.exports.setProxyEvent = function(event, handle) {
  proxy.on(event, handle);
};

/**
 * Koa Http Proxy Middleware
 */
module.exports.proxy = (context, options) => (ctx, next) => {
  // create a match function
  const match = route(context);
  if (!match(ctx.req.url)) return next();

  let opts = options;
  if (typeof options === 'function') {
    const params = match(ctx.req.url);
    opts = options.call(options, params);
  }

  const {logs, pathRewrite} = opts;

  return new Promise((resolve) => {
    ctx.req.oldPath = ctx.req.url;
    if (typeof pathRewrite === 'function') {
      ctx.req.url = pathRewrite(ctx.req.url);
    }
    ctx.req.targetUrl = opts.target + ctx.req.url;
    proxy.web(ctx.req, ctx.res, opts, (err) => {
      // 错误处理
      const status = {
        ECONNREFUSED: 503, // 连接失败
        ETIMEDOUT: 504, // 连接超时
      }[err.code];
      if (status) ctx.status = status;
      ctx.body = err.message;
      if(logs) {
        const {method, oldPath, targetUrl} = ctx.req;
        L(ctx.status, method, oldPath, 'To', targetUrl);
      }
      resolve();
    });
  });
};

// proxy.on('start', function(err, req, res) {
//   L('proxy start');
// });
// proxy.on('end', function(err, req, res) {
//   L('proxy end');
// });
// proxy.on('error', function(err, req, res) {
//   L('proxy error');
// });

// proxy.on('econnreset', function(err, req, res) {
//   L('proxy econnreset');
// });

proxy.on('proxyRes', function(proxyRes, req, res) {
  const {method, oldPath, targetUrl} = req;
  const {statusCode} = proxyRes;
  L(statusCode, method, oldPath, 'To', targetUrl);
});
// proxy.on('proxyReq', function(proxyReq, req, res) {
//   // console.log(req.url, req.method);
// });
