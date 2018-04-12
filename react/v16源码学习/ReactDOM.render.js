
 ReactDOM.render: function (element, container, callback) {
    return legacyRenderSubtreeIntoContainer(null, element, container, false, callback);
  },

function legacyRenderSubtreeIntoContainer(parentComponent, children, container, forceHydrate, callback) {
  
    // 初始化时
    // parentComponent null
    // children App
    // container div#app DOM元素
    // forceHydrate false
    // callback 不解释

    var root = container._reactRootContainer; //undefined
    if (!root) {
      // Initial mount
      // 生成一个 ReactRoot ，挂载到 container 上
      root = container._reactRootContainer = legacyCreateRootFromDOMContainer(container, forceHydrate);
      if (typeof callback === 'function') {
        var originalCallback = callback;
        callback = function () {
          console.log(root._internalRoot)
          var instance = DOMRenderer.getPublicRootInstance(root._internalRoot);
          console.log(instance)
          originalCallback.call(instance);
        };
      }
      // Initial mount should not be batched.
      DOMRenderer.unbatchedUpdates(function () {
        if (parentComponent != null) {
          root.legacy_renderSubtreeIntoContainer(parentComponent, children, callback);
        } else {
          root.render(children, callback);
        }
      });
    } else {
      if (typeof callback === 'function') {
        var _originalCallback = callback;
        callback = function () {
          var instance = DOMRenderer.getPublicRootInstance(root._internalRoot);
          _originalCallback.call(instance);
        };
      }
      // Update
      if (parentComponent != null) {
        root.legacy_renderSubtreeIntoContainer(parentComponent, children, callback);
      } else {
        root.render(children, callback);
      }
    }
    return DOMRenderer.getPublicRootInstance(root._internalRoot);
  }
  

  function legacyCreateRootFromDOMContainer(container, forceHydrate) {
    var shouldHydrate = forceHydrate || shouldHydrateDueToLegacyHeuristic(container);
    // First clear any existing content.

    // 清除container元素的所有子元素
    if (!shouldHydrate) {
      var warned = false;
      var rootSibling = void 0;
      while (rootSibling = container.lastChild) {
    
        container.removeChild(rootSibling);
      }
    }
   
    // Legacy roots are not async by default.
    var isAsync = false;
    return new ReactRoot(container, isAsync, shouldHydrate);
  }