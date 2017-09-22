function initWatch (vm: Component, watch: Object) {
    for (const key in watch) {
        const handler = watch[key]
        if (Array.isArray(handler)) {
            for (let i = 0; i < handler.length; i++) {
                createWatcher(vm, key, handler[i])
            }
        } else {
            createWatcher(vm, key, handler)
        }
    }
}

function createWatcher (vm: Component, key: string, handler: any) {
    let options
    if (isPlainObject(handler)) {
        options = handler
        handler = handler.handler
    }
    if (typeof handler === 'string') {
        handler = vm[handler]
    }
    vm.$watch(key, handler, options)
}

Vue.prototype.$watch = function (
    expOrFn,
    cb,
    options
  ) {
    var vm = this;
    options = options || {};
    options.user = true;

    //创建一个watcher，实例化过程见下方
    var watcher = new Watcher(vm, expOrFn, cb, options);


    if (options.immediate) {
      cb.call(vm, watcher.value);
    }
    return function unwatchFn () {
      watcher.teardown();
    }
  };

  var Watcher = function Watcher (
    vm,
    expOrFn,
    cb,
    options
  ) {
    // console.error(this);
    this.vm = vm;
    //将当前watcher添加到vm._watchers数组中
    vm._watchers.push(this);
    // options
    if (options) {
      this.deep = !!options.deep;
      this.user = !!options.user;
      this.lazy = !!options.lazy;
      this.sync = !!options.sync;
    } else {
      this.deep = this.user = this.lazy = this.sync = false;
    }
    //绑定回调函数
    this.cb = cb;
    this.id = ++uid$2; // uid for batching
    this.active = true;
    this.dirty = this.lazy; // for lazy watchers
    this.deps = [];
    this.newDeps = [];
    this.depIds = new _Set();
    this.newDepIds = new _Set();
    //绑定expression  如果监听的是vm.data.key，expression就是key值
    this.expression = expOrFn.toString();
    // 解析getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
        //如果expOrFn，是vm.data的某个属性,this.getter返回该属性的值，在返回值的同时，会触发vm.key的get方法，将当前watcher和该属性的依赖(dep)相互绑定,于是当该属性的值发生改变的时候，触发set方法，调用dep.nodify()方法，依次触发每个关联watcher的回调函数,这就是$watch的实现流程

        // this.getter = function (obj) {
        //     for (var i = 0; i < segments.length; i++) {
        //         if (!obj) { return }
        //         obj = obj[segments[i]];
        //     }
        //     return obj
        // }
      this.getter = parsePath(expOrFn);
      if (!this.getter) {
        this.getter = function () {};
        "development" !== 'production' && warn(
          "Failed watching path: \"" + expOrFn + "\" " +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        );
      }
    }
    //获得watcher.value
    this.value = this.lazy
      ? undefined
      : this.get();
  };


  var bailRE = /[^\w.$]/;
  function parsePath (path) {
    if (bailRE.test(path)) {
      return
    } else {
      var segments = path.split('.');
      return function (obj) {
        for (var i = 0; i < segments.length; i++) {
          if (!obj) { return }
          obj = obj[segments[i]];
        }
        return obj
      }
    }
  }

  Watcher.prototype.get = function get () {
    //将Dep.target设置为当前watcher
    pushTarget(this);
    //调用watcher.getter并将this绑定为vm,并传入vm为参数，如果watch的是vm.data的某个属性,返回该属性的值
    var value = this.getter.call(this.vm, this.vm);
    //深度监控
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    this.cleanupDeps();
    return value
  };