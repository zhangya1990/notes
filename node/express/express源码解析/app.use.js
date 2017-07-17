app.use = function use(fn) {
    var offset = 0;
    var path = '/';

    // default path to '/'
    // disambiguate app.use([fn])
    if (typeof fn !== 'function') {
        var arg = fn;

        while (Array.isArray(arg) && arg.length !== 0) {
            arg = arg[0];
        }

        // first arg is the path
        if (typeof arg !== 'function') {
            offset = 1;
            path = fn;
        }
    }

    //得到当次绑定到匹配路径的所有中间件
    var fns = flatten(slice.call(arguments, offset));

    if (fns.length === 0) {
        throw new TypeError('app.use() requires middleware functions');
    }

    // 设置router
    this.lazyrouter();
    var router = this._router;

    fns.forEach(function (fn) {
        // non-express app
        if (!fn || !fn.handle || !fn.set) {
            return router.use(path, fn);
        }

        //app.use(express())
        debug('.use app under %s', path);
        fn.mountpath = path;
        fn.parent = this;

        // restore .app property on req and res
        router.use(path, function mounted_app(req, res, next) {
            var orig = req.app;
            fn.handle(req, res, function (err) {
                req.__proto__ = orig.request;
                res.__proto__ = orig.response;
                next(err);
            });
        });

        // mounted an app
        fn.emit('mount', this);
    }, this);

    return this;
};

//创建一个router实例，绑定到app._router属性
app.lazyrouter = function lazyrouter() {
    if (!this._router) {
        this._router = new Router({
            caseSensitive: this.enabled('case sensitive routing'),
            strict: this.enabled('strict routing')
        });

        //添加query-parser中间件，解析url为req.query
        this._router.use(query(this.get('query parser fn')));

        //初始化middleware属性
        this._router.use(middleware.init(this));
    }
};

middleware.init = function(app){
    return function expressInit(req, res, next){
        if (app.enabled('x-powered-by')) res.setHeader('X-Powered-By', 'Express');
        req.res = res;
        res.req = req;
        req.next = next;

        req.__proto__ = app.request;
        res.__proto__ = app.response;

        res.locals = res.locals || Object.create(null);

        next();
    };
};
