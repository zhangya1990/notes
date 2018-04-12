
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
      // 首次渲染
      // 生成一个 ReactRoot 实例，挂载到 container 的 _reactRootContainer 属性上
      root = container._reactRootContainer = legacyCreateRootFromDOMContainer(container, forceHydrate);
      if (typeof callback === 'function') {
        var originalCallback = callback;
        callback = function () {
          // console.log(root._internalRoot) fiberRoot实例
          var instance = DOMRenderer.getPublicRootInstance(root._internalRoot);
          console.log(instance) //组件实例 App组件实例
          originalCallback.call(instance);
        };
      }
      // Initial mount should not be batched.
      // 首次插入必须同步执行，不能批量插入
      DOMRenderer.unbatchedUpdates(function () {
        // 如果存在parentComponent，渲染子树
        if (parentComponent != null) {
          root.legacy_renderSubtreeIntoContainer(parentComponent, children, callback);
        } else {
          //直接将children插入container
          root.render(children, callback);
        }
      });
    } else {

      // 非首次渲染
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

    // 以当前container初始化一个ReactRoot实例并返回，reactRootInstance._internalRoot = fiberRootInstance
    return new ReactRoot(container, isAsync, shouldHydrate);
  }