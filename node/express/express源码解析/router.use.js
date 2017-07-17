
//将本次绑定到当前路径的每个路由回调函数创建一个layer实例，并依次添加到router.stack中
router.use = function use(fn) {
    var offset = 0;
    var path = '/';

    // default path to '/'
    // disambiguate router.use([fn])
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

    var callbacks = flatten(slice.call(arguments, offset));

    if (callbacks.length === 0) {
        throw new TypeError('Router.use() requires middleware functions');
    }

    for (var i = 0; i < callbacks.length; i++) {
        var fn = callbacks[i];

        if (typeof fn !== 'function') {
            throw new TypeError('Router.use() requires middleware function but got a ' + gettype(fn));
        }

        // add the middleware
        debug('use %s %s', path, fn.name || '<anonymous>');

        var layer = new Layer(path, {
            sensitive: this.caseSensitive,
            strict: false,
            end: false
        }, fn);

        layer.route = undefined;

        this.stack.push(layer);
    }

    return this;
};