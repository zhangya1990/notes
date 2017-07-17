const R = require('ramda');

var _xwrap =  (function() {
    function XWrap(fn) {
        console.log(fn)
        console.log(fn.toString())
        this.f = fn;
    }
    XWrap.prototype['@@transducer/init'] = function() {
        throw new Error('init not implemented on XWrap');
    };
    XWrap.prototype['@@transducer/result'] = function(acc) { return acc; };
    XWrap.prototype['@@transducer/step'] = function(acc, x) {
        return this.f(acc, x);
    };

    return function _xwrap(fn) { return new XWrap(fn); };
}());
var _reduce = (function() {
    var bind = _curry2(function bind(fn, thisObj) {
        return _arity(fn.length, function() {
            return fn.apply(thisObj, arguments);
        });
    });
    var _isArray = Array.isArray || function _isArray(val) {
            return (val != null &&
            val.length >= 0 &&
            Object.prototype.toString.call(val) === '[object Array]');
        };
    var isArrayLike = _curry1(function isArrayLike(x) {
        if (_isArray(x)) { return true; }
        if (!x) { return false; }
        if (typeof x !== 'object') { return false; }
        if (_isString(x)) { return false; }
        if (x.nodeType === 1) { return !!x.length; }
        if (x.length === 0) { return true; }
        if (x.length > 0) {
            return x.hasOwnProperty(0) && x.hasOwnProperty(x.length - 1);
        }
        return false;
    });
    function _isString(x) {
        return Object.prototype.toString.call(x) === '[object String]';
    }
    function _arrayReduce(xf, acc, list) {
        var idx = 0;
        var len = list.length;
        console.log(list)
        console.log(xf['@@transducer/step'].toString())
        console.log(xf['@@transducer/step'].toString())

        while (idx < len) {
            acc = xf['@@transducer/step'](acc, list[idx]);
            if (acc && acc['@@transducer/reduced']) {
                acc = acc['@@transducer/value'];
                break;
            }
            idx += 1;
        }
        console.log(acc)
        console.log(61)
        return xf['@@transducer/result'](acc);
    }

    function _iterableReduce(xf, acc, iter) {
        var step = iter.next();
        while (!step.done) {
            acc = xf['@@transducer/step'](acc, step.value);
            if (acc && acc['@@transducer/reduced']) {
                acc = acc['@@transducer/value'];
                break;
            }
            step = iter.next();
        }
        return xf['@@transducer/result'](acc);
    }

    function _methodReduce(xf, acc, obj) {
        console.log(arguments)
        return xf['@@transducer/result'](obj.reduce(bind(xf['@@transducer/step'], xf), acc));
    }

    var symIterator = (typeof Symbol !== 'undefined') ? Symbol.iterator : '@@iterator';
    return function _reduce(fn, acc, list) {
        if (typeof fn === 'function') {
            fn = _xwrap(fn);
        }
        if (isArrayLike(list)) {
            return _arrayReduce(fn, acc, list);
        }
        if (typeof list.reduce === 'function') {
            return _methodReduce(fn, acc, list);
        }
        if (list[symIterator] != null) {
            return _iterableReduce(fn, acc, list[symIterator]());
        }
        if (typeof list.next === 'function') {
            return _iterableReduce(fn, acc, list);
        }
        throw new TypeError('reduce: list must be array or iterable');
    };
}());
var curryN = _curry2(function curryN(length, fn) {
    if (length === 1) {
        return _curry1(fn);
    }
    return _arity(length, _curryN(length, [], fn));
});
function _curry2(fn) {
    return function f2(a, b) {
        switch (arguments.length) {
            case 0:
                return f2;
            case 1:
                return _isPlaceholder(a) ? f2
                    : _curry1(function(_b) { return fn(a, _b); });
            default:
                return _isPlaceholder(a) && _isPlaceholder(b) ? f2
                    : _isPlaceholder(a) ? _curry1(function(_a) { return fn(_a, b); })
                    : _isPlaceholder(b) ? _curry1(function(_b) { return fn(a, _b); })
                    : fn(a, b);
        }
    };
}
function _curry1(fn) {
    return function f1(a) {
        if (arguments.length === 0 || _isPlaceholder(a)) {
            return f1;
        } else {
            return fn.apply(this, arguments);
        }
    };
}
function _isPlaceholder(a) {
    return a != null &&
        typeof a === 'object' &&
        a['@@functional/placeholder'] === true;
}
function _arity(n, fn) {
    switch (n) {
        case 0: return function() { return fn.apply(this, arguments); };
        case 1: return function(a0) { return fn.apply(this, arguments); };
        case 2: return function(a0, a1) { return fn.apply(this, arguments); };
        case 3: return function(a0, a1, a2) { return fn.apply(this, arguments); };
        case 4: return function(a0, a1, a2, a3) { return fn.apply(this, arguments); };
        case 5: return function(a0, a1, a2, a3, a4) { return fn.apply(this, arguments); };
        case 6: return function(a0, a1, a2, a3, a4, a5) { return fn.apply(this, arguments); };
        case 7: return function(a0, a1, a2, a3, a4, a5, a6) { return fn.apply(this, arguments); };
        case 8: return function(a0, a1, a2, a3, a4, a5, a6, a7) { return fn.apply(this, arguments); };
        case 9: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8) { return fn.apply(this, arguments); };
        case 10: return function(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9) { return fn.apply(this, arguments); };
        default: throw new Error('First argument to _arity must be a non-negative integer no greater than ten');
    }
};
function _curryN(length, received, fn) {
    return function() {
        var combined = [];
        var argsIdx = 0;
        var left = length;
        var combinedIdx = 0;
        while (combinedIdx < received.length || argsIdx < arguments.length) {
            var result;
            if (combinedIdx < received.length &&
                (!_isPlaceholder(received[combinedIdx]) ||
                argsIdx >= arguments.length)) {
                result = received[combinedIdx];
            } else {
                result = arguments[argsIdx];
                argsIdx += 1;
            }
            combined[combinedIdx] = result;
            if (!_isPlaceholder(result)) {
                left -= 1;
            }
            combinedIdx += 1;
        }
        return left <= 0 ? fn.apply(this, combined)
            : _arity(left, _curryN(length, combined, fn));
    };
};
const transduce = curryN(4, function lalala(xf, fn, acc, list) {
    return _reduce(xf(typeof fn === 'function' ? _xwrap(fn) : fn), acc, list);
});
var append = function (newArr, x) {
    console.log(newArr)
    console.log(x)
    newArr.push(x);
    return newArr;
};
console.log(transduce(R.map(R.add(1)), append, [], [1,2,3,4]));

console.log(R.map(R.add(1))(append) === R.map(R.add(1),append))
console.log(R.map(R.add(1)).toString())
console.log(R.map().toString())