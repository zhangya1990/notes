function ReactRoot(container, isAsync, hydrate) {
    var root = DOMRenderer.createContainer(container, isAsync, hydrate);
    this._internalRoot = root;
  }
  ReactRoot.prototype.render = function (children, callback) {
    var root = this._internalRoot;
    var work = new ReactWork();
    callback = callback === undefined ? null : callback;
    {
      warnOnInvalidCallback(callback, 'render');
    }
    if (callback !== null) {
      work.then(callback);
    }
    DOMRenderer.updateContainer(children, root, null, work._onCommit);
    return work;
  };
  ReactRoot.prototype.unmount = function (callback) {
    var root = this._internalRoot;
    var work = new ReactWork();
    callback = callback === undefined ? null : callback;
    {
      warnOnInvalidCallback(callback, 'render');
    }
    if (callback !== null) {
      work.then(callback);
    }
    DOMRenderer.updateContainer(null, root, null, work._onCommit);
    return work;
  };
  ReactRoot.prototype.legacy_renderSubtreeIntoContainer = function (parentComponent, children, callback) {
    var root = this._internalRoot;
    var work = new ReactWork();
    callback = callback === undefined ? null : callback;
    {
      warnOnInvalidCallback(callback, 'render');
    }
    if (callback !== null) {
      work.then(callback);
    }
    DOMRenderer.updateContainer(children, root, parentComponent, work._onCommit);
    return work;
  };
  ReactRoot.prototype.createBatch = function () {
    var batch = new ReactBatch(this);
    var expirationTime = batch._expirationTime;
  
    var internalRoot = this._internalRoot;
    var firstBatch = internalRoot.firstBatch;
    if (firstBatch === null) {
      internalRoot.firstBatch = batch;
      batch._next = null;
    } else {
      // Insert sorted by expiration time then insertion order
      var insertAfter = null;
      var insertBefore = firstBatch;
      while (insertBefore !== null && insertBefore._expirationTime <= expirationTime) {
        insertAfter = insertBefore;
        insertBefore = insertBefore._next;
      }
      batch._next = insertBefore;
      if (insertAfter !== null) {
        insertAfter._next = batch;
      }
    }
  
    return batch;
  };
  