router.handle = function handle(req, res, out) {
    var self = this;

    debug('dispatching %s %s', req.method, req.url);

    var search = 1 + req.url.indexOf('?');
    var pathlength = search ? search - 1 : req.url.length;
    var fqdn = req.url[0] !== '/' && 1 + req.url.substr(0, pathlength).indexOf('://');
    var protohost = fqdn ? req.url.substr(0, req.url.indexOf('/', 2 + fqdn)) : '';
    var idx = 0;
    var removed = '';
    var slashAdded = false;
    var paramcalled = {};

    // store options for OPTIONS request
    // only used if OPTIONS request
    var options = [];

    // middleware and routes
    var stack = self.stack;

    // manage inter-router variables
    var parentParams = req.params;
    var parentUrl = req.baseUrl || '';
    var done = restore(out, req, 'baseUrl', 'next', 'params');

    // setup next layer
    req.next = next;

    // for options requests, respond with a default if nothing else responds
    if (req.method === 'OPTIONS') {
        done = wrap(done, function(old, err) {
            if (err || options.length === 0) return old(err);
            sendOptionsResponse(res, options, old);
        });
    }

    // setup basic req values
    req.baseUrl = parentUrl;
    req.originalUrl = req.originalUrl || req.url;

    next();

    function next(err) {
        var layerError = err === 'route'
            ? null
            : err;

        // remove added slash
        if (slashAdded) {
            req.url = req.url.substr(1);
            slashAdded = false;
        }

        // restore altered req.url
        if (removed.length !== 0) {
            req.baseUrl = parentUrl;
            req.url = protohost + removed + req.url.substr(protohost.length);
            removed = '';
        }

        // no more matching layers
        if (idx >= stack.length) {
            setImmediate(done, layerError);
            return;
        }

        // get pathname of request
        var path = getPathname(req);

        if (path == null) {
            return done(layerError);
        }

        // find next matching layer
        var layer;
        var match;
        var route;

        while (match !== true && idx < stack.length) {
            layer = stack[idx++];
            match = matchLayer(layer, path);
            route = layer.route;

            if (typeof match !== 'boolean') {
                // hold on to layerError
                layerError = layerError || match;
            }

            if (match !== true) {
                continue;
            }

            if (!route) {
                // process non-route handlers normally
                continue;
            }

            if (layerError) {
                // routes do not match with a pending error
                match = false;
                continue;
            }

            var method = req.method;
            var has_method = route._handles_method(method);

            // build up automatic options response
            if (!has_method && method === 'OPTIONS') {
                appendMethods(options, route._options());
            }

            // don't even bother matching route
            if (!has_method && method !== 'HEAD') {
                match = false;
                continue;
            }
        }

        // no match
        if (match !== true) {
            return done(layerError);
        }

        // store route for dispatch on change
        if (route) {
            req.route = route;
        }

        // Capture one-time layer values
        req.params = self.mergeParams
            ? mergeParams(layer.params, parentParams)
            : layer.params;
        var layerPath = layer.path;

        // this should be done for the layer
        self.process_params(layer, paramcalled, req, res, function (err) {
            if (err) {
                return next(layerError || err);
            }

            if (route) {
                return layer.handle_request(req, res, next);
            }

            trim_prefix(layer, layerError, layerPath, path);
        });
    }

    function trim_prefix(layer, layerError, layerPath, path) {
        var c = path[layerPath.length];
        if (c && '/' !== c && '.' !== c) return next(layerError);

        // Trim off the part of the url that matches the route
        // middleware (.use stuff) needs to have the path stripped
        if (layerPath.length !== 0) {
            debug('trim prefix (%s) from url %s', layerPath, req.url);
            removed = layerPath;
            req.url = protohost + req.url.substr(protohost.length + removed.length);

            // Ensure leading slash
            if (!fqdn && req.url[0] !== '/') {
                req.url = '/' + req.url;
                slashAdded = true;
            }

            // Setup base URL (no trailing slash)
            req.baseUrl = parentUrl + (removed[removed.length - 1] === '/'
                    ? removed.substring(0, removed.length - 1)
                    : removed);
        }

        debug('%s %s : %s', layer.name, layerPath, req.originalUrl);

        if (layerError) {
            layer.handle_error(layerError, req, res, next);
        } else {
            layer.handle_request(req, res, next);
        }
    }
};