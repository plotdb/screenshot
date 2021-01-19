// Generated by LiveScript 1.6.0
var puppeteer, BrowserPool;
puppeteer = require('puppeteer');
BrowserPool = function(opt){
  var ref$, this$ = this;
  opt == null && (opt = {});
  this.opt = opt;
  this.count = (ref$ = opt.count || 4) < 10000 ? ref$ : 10000;
  this.retryCount = 5;
  this.queue = [];
  ['beforeExit', 'uncaughtException', 'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'].map(function(n){
    return process.on(n, function(){
      this$.destroy();
      return 0;
    });
  });
  return this;
};
BrowserPool.prototype = import$(Object.create(Object.prototype), {
  exec: function(cb){
    var lc, _, this$ = this;
    lc = {
      trial: 0
    };
    _ = function(){
      return this$.get().then(function(obj){
        return lc.obj = obj;
      }).then(function(){
        return cb(lc.obj.page);
      }).then(function(it){
        return lc.ret = it;
      })['catch'](function(it){
        var ref$;
        if ((lc.trial++) > this$.retryCount) {
          return Promise.reject((ref$ = new Error(), ref$.id = 0, ref$.name = 'ldError', ref$));
        }
        console.error("[pageshot] command failed, will retry ( " + lc.trial + " ): ", it);
        return this$.respawn(lc.obj).then(function(){
          return _();
        });
      }).then(function(){
        return this$.free(lc.obj);
      }).then(function(){
        return lc.ret;
      });
    };
    return _();
  },
  screenshot: function(payload){
    payload == null && (payload = {});
    return this.exec(function(page){
      var p, ref$;
      p = payload.html
        ? page.setContent(payload.html, {
          waitUntil: "domcontentloaded"
        })
        : payload.url
          ? page.goto(payload.url)
          : Promise.reject((ref$ = new Error(), ref$.id = 1015, ref$.name = 'ldError', ref$.msg = "missing url or html", ref$));
      return p.then(function(){
        return page.screenshot();
      });
    });
  },
  print: function(payload){
    payload == null && (payload = {});
    return this.exec(function(page){
      var p;
      p = payload.html
        ? page.setContent(payload.html, {
          waitUntil: "networkidle0"
        })
        : payload.url
          ? page.goto(payload.url)
          : Promise.reject(new ldError(1015));
      return p.then(function(){
        var ret;
        ret = page.pdf({
          format: 'A4'
        });
        return ret;
      });
    });
  },
  merge: function(payload){
    var this$ = this;
    payload == null && (payload = {});
    return Promise.resolve().then(function(){
      if (!payload.html) {
        return null;
      }
      return this$.print({
        html: payload.html
      }).then(function(buf){
        return tmpfn().then(function(arg$){
          var fn;
          fn = arg$.fn;
          return new Promise(function(res, rej){
            return fs.writeFile(fn, buf, function(e){
              if (e) {
                return rej(new Error(e));
              }
              return res(fn);
            });
          });
        });
      });
    }).then(function(htmlFn){
      if (!payload.files || payload.files.length < 1 || (payload.files.length === 1 && !htmlFn)) {
        return Promise.reject(new lderror(400));
      }
      return new Promise(function(res, rej){
        return easyPdfMerge((htmlFn
          ? [htmlFn]
          : []).concat(payload.files), payload.outfile, function(e){
          if (e) {
            return rej(e);
          }
          return res(payload.outfile);
        });
      });
    });
  },
  get: function(){
    var this$ = this;
    return new Promise(function(res, rej){
      var i$, to$, i;
      for (i$ = 0, to$ = this$.pages.length; i$ < to$; ++i$) {
        i = i$;
        if (!this$.pages[i].busy) {
          this$.pages[i].busy = true;
          return res(this$.pages[i]);
        }
      }
      return this$.queue.push({
        res: res,
        rej: rej
      });
    });
  },
  free: function(obj){
    var ret;
    if (this.queue.length) {
      ret = this.queue.splice(0, 1)[0];
      return ret.res(obj);
    } else {
      return obj.busy = false;
    }
  },
  destroy: function(){
    var that;
    this.pages.map(function(arg$){
      var page;
      page = arg$.page;
      return page.close();
    });
    if (that = BrowserPool.browser) {
      return that.close();
    }
  },
  init: function(){
    var that, this$ = this;
    return ((that = BrowserPool.browser)
      ? Promise.resolve(that)
      : puppeteer.launch({
        headless: true,
        args: ['--no-sandbox']
      })).then(function(browser){
      var i;
      BrowserPool.browser = browser;
      return Promise.all((function(){
        var i$, to$, results$ = [];
        for (i$ = 0, to$ = this.count; i$ < to$; ++i$) {
          i = i$;
          results$.push(browser.newPage().then(fn$));
        }
        return results$;
        function fn$(it){
          return {
            busy: false,
            page: it
          };
        }
      }.call(this$)));
    }).then(function(it){
      return this$.pages = it;
    });
  },
  respawn: function(obj){
    return Promise.resolve().then(function(){
      if (!obj.page.isClosed()) {
        return page.close();
      }
    })['catch'](function(){}).then(function(){
      return BrowserPool.browser.newPage();
    }).then(function(page){
      return obj.page = page;
    });
  }
});
module.exports = BrowserPool;
function import$(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
