function createHostRootFiber(isAsync) {
  var mode = isAsync ? AsyncMode | StrictMode : NoContext;
  return createFiber(HostRoot, null, null, mode);
}

var createFiber = function (tag, pendingProps, key, mode) {
  // $FlowFixMe: the shapes are exact here but Flow doesn't like constructors
  return new FiberNode(tag, pendingProps, key, mode);
};


type FiberRoot = {
    // fiber节点的容器元素相关信息，通常会直接传入容器元素
    containerInfo: any,
    // Used only by persistent updates.
    pendingChildren: any,

    // The currently active root fiber. This is the mutable root of the tree.
     // 当前fiber树中激活状态（正在处理）的fiber节点
    current: Fiber,
    pendingCommitExpirationTime: ExpirationTime,


    // A finished work-in-progress HostRoot that's ready to be committed.
    // 准备好提交的已处理完成的work-in-progress
    finishedWork: Fiber | null,

    // Top context object, used by renderSubtreeIntoContainer
    context: Object | null,
    pendingContext: Object | null,

    // Determines if we should attempt to hydrate on the initial mount
    hydrate: boolean,

    // Remaining expiration time on this root.
    // 此节点剩余的任务到期时间
    remainingExpirationTime: ExpirationTime,

    // List of top-level batches. This list indicates whether a commit should be
    // deferred. Also contains completion callbacks.
    // 顶级批次清单。此列表指示是否应该推迟一次提交，还包含完成的回调
    firstBatch: Batch | null,

    // Linked-list of roots
    // 多组件树FirberRoot对象以单链表存储链接，指向下一个需要调度的FiberRoot
    nextScheduledRoot: FiberRoot | null,
  };

function createFiberRoot(containerInfo, isAsync, hydrate) {
  // Cyclic construction. This cheats the type system right now because
  // stateNode is any.
  // 初始化一个空fiber，并且与root建立关联，fiber.stateNode = root  root.current = fiber
  var uninitializedFiber = createHostRootFiber(isAsync);
  var root = {
    current: uninitializedFiber,
    containerInfo: containerInfo,
    pendingChildren: null,
    pendingCommitExpirationTime: NoWork,
    finishedWork: null,
    context: null,
    pendingContext: null,
    hydrate: hydrate,
    remainingExpirationTime: NoWork,
    firstBatch: null,
    nextScheduledRoot: null
  };
  uninitializedFiber.stateNode = root;
  return root;
}



var reactReconciler = function (config) {
  var getPublicInstance = config.getPublicInstance;

  var _ReactFiberScheduler = ReactFiberScheduler(config),
      computeUniqueAsyncExpiration = _ReactFiberScheduler.computeUniqueAsyncExpiration,
      recalculateCurrentTime = _ReactFiberScheduler.recalculateCurrentTime,
      computeExpirationForFiber = _ReactFiberScheduler.computeExpirationForFiber,
      scheduleWork = _ReactFiberScheduler.scheduleWork,
      requestWork = _ReactFiberScheduler.requestWork,
      flushRoot = _ReactFiberScheduler.flushRoot,
      batchedUpdates = _ReactFiberScheduler.batchedUpdates,
      unbatchedUpdates = _ReactFiberScheduler.unbatchedUpdates,
      flushSync = _ReactFiberScheduler.flushSync,
      flushControlled = _ReactFiberScheduler.flushControlled,
      deferredUpdates = _ReactFiberScheduler.deferredUpdates,
      syncUpdates = _ReactFiberScheduler.syncUpdates,
      interactiveUpdates = _ReactFiberScheduler.interactiveUpdates,
      flushInteractiveUpdates = _ReactFiberScheduler.flushInteractiveUpdates,
      legacyContext = _ReactFiberScheduler.legacyContext;

  var findCurrentUnmaskedContext = legacyContext.findCurrentUnmaskedContext,
      isContextProvider = legacyContext.isContextProvider,
      processChildContext = legacyContext.processChildContext;


  function getContextForSubtree(parentComponent) {
    if (!parentComponent) {
      return emptyObject;
    }

    var fiber = get(parentComponent);
    var parentContext = findCurrentUnmaskedContext(fiber);
    return isContextProvider(fiber) ? processChildContext(fiber, parentContext) : parentContext;
  }

  function scheduleRootUpdate(current, element, currentTime, expirationTime, callback) {
    
    callback = callback === undefined ? null : callback;
    
    // 注意首次插入时的partialState:{element}
    var update = {
      expirationTime: expirationTime,
      partialState: { element: element },
      callback: callback,
      isReplace: false,
      isForced: false,
      capturedValue: null,
      next: null
    };
    // 本次update对象添加到当前调度的fiber中，见 ./updateQueue.js
    insertUpdateIntoFiber(current, update);

    // 调度当前任务,见 ./scheduleWork.js
    scheduleWork(current, expirationTime);

    return expirationTime;
  }

  function updateContainerAtExpirationTime(element, container, parentComponent, currentTime, expirationTime, callback) {
    // TODO: If this is a nested container, this won't be the root.
    var current = container.current;

    {
      if (ReactFiberInstrumentation_1.debugTool) {
        if (current.alternate === null) {
          ReactFiberInstrumentation_1.debugTool.onMountContainer(container);
        } else if (element === null) {
          ReactFiberInstrumentation_1.debugTool.onUnmountContainer(container);
        } else {
          ReactFiberInstrumentation_1.debugTool.onUpdateContainer(container);
        }
      }
    }

// 首次插入时parentComponent为空对象
    var context = getContextForSubtree(parentComponent);
    if (container.context === null) {
      container.context = context;
    } else {
      container.pendingContext = context;
    }

// 调度更新（插入）
    return scheduleRootUpdate(current, element, currentTime, expirationTime, callback);
  }

  function findHostInstance(fiber) {
    var hostFiber = findCurrentHostFiber(fiber);
    if (hostFiber === null) {
      return null;
    }
    return hostFiber.stateNode;
  }

// DOMRenderer对象
  return {
    createContainer: function (containerInfo, isAsync, hydrate) {
      // 创建一个fiberRoot对象并返回
      return createFiberRoot(containerInfo, isAsync, hydrate);
    },
    updateContainer: function (element, container, parentComponent, callback) {
      var current = container.current;// 获取当前fiberNode  container(fiberRoot对象).current
      var currentTime = recalculateCurrentTime();// 获取当前时间
      var expirationTime = computeExpirationForFiber(current); //计算当前 fiberNode的过期时间,./expirationTime.js,同步插入 Sync
      return updateContainerAtExpirationTime(element, container, parentComponent, currentTime, expirationTime, callback);
    },
    updateContainerAtExpirationTime: function (element, container, parentComponent, expirationTime, callback) {
      var currentTime = recalculateCurrentTime();
      return updateContainerAtExpirationTime(element, container, parentComponent, currentTime, expirationTime, callback);
    },


    flushRoot: flushRoot,

    requestWork: requestWork,

    computeUniqueAsyncExpiration: computeUniqueAsyncExpiration,

    batchedUpdates: batchedUpdates,

    unbatchedUpdates: unbatchedUpdates,

    deferredUpdates: deferredUpdates,

    syncUpdates: syncUpdates,

    interactiveUpdates: interactiveUpdates,

    flushInteractiveUpdates: flushInteractiveUpdates,

    flushControlled: flushControlled,

    flushSync: flushSync,

// container fiberRoot实例
    getPublicRootInstance: function (container) {
      var containerFiber = container.current;// 根fiberNode实例(HostRoot)
      if (!containerFiber.child) {
        return null;
      }
      switch (containerFiber.child.tag) {
        case HostComponent:
        // div span p ...
          return getPublicInstance(containerFiber.child.stateNode);
        default:
        // App组件实例
          return containerFiber.child.stateNode;
      }
    },


    findHostInstance: findHostInstance,

    findHostInstanceWithNoPortals: function (fiber) {
      var hostFiber = findCurrentHostFiberWithNoPortals(fiber);
      if (hostFiber === null) {
        return null;
      }
      return hostFiber.stateNode;
    },
    injectIntoDevTools: function (devToolsConfig) {
      var findFiberByHostInstance = devToolsConfig.findFiberByHostInstance;

      return injectInternals(_assign({}, devToolsConfig, {
        findHostInstanceByFiber: function (fiber) {
          return findHostInstance(fiber);
        },
        findFiberByHostInstance: function (instance) {
          if (!findFiberByHostInstance) {
            // Might not be implemented by the renderer.
            return null;
          }
          return findFiberByHostInstance(instance);
        }
      }));
    }
  };
};

var DOMRenderer = reactReconciler({
    getRootHostContext: function (rootContainerInstance) {
      var type = void 0;
      var namespace = void 0;
      var nodeType = rootContainerInstance.nodeType;
      switch (nodeType) {
        case DOCUMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE:
          {
            type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
            var root = rootContainerInstance.documentElement;
            namespace = root ? root.namespaceURI : getChildNamespace(null, '');
            break;
          }
        default:
          {
            var container = nodeType === COMMENT_NODE ? rootContainerInstance.parentNode : rootContainerInstance;
            var ownNamespace = container.namespaceURI || null;
            type = container.tagName;
            namespace = getChildNamespace(ownNamespace, type);
            break;
          }
      }
      {
        var validatedTag = type.toLowerCase();
        var _ancestorInfo = updatedAncestorInfo(null, validatedTag, null);
        return { namespace: namespace, ancestorInfo: _ancestorInfo };
      }
      return namespace;
    },
    getChildHostContext: function (parentHostContext, type) {
      {
        var parentHostContextDev = parentHostContext;
        var _namespace = getChildNamespace(parentHostContextDev.namespace, type);
        var _ancestorInfo2 = updatedAncestorInfo(parentHostContextDev.ancestorInfo, type, null);
        return { namespace: _namespace, ancestorInfo: _ancestorInfo2 };
      }
      var parentNamespace = parentHostContext;
      return getChildNamespace(parentNamespace, type);
    },
    getPublicInstance: function (instance) {
      return instance;
    },
    prepareForCommit: function () {
      eventsEnabled = isEnabled();
      selectionInformation = getSelectionInformation();
      setEnabled(false);
    },
    resetAfterCommit: function () {
      restoreSelection(selectionInformation);
      selectionInformation = null;
      setEnabled(eventsEnabled);
      eventsEnabled = null;
    },
    createInstance: function (type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
      var parentNamespace = void 0;
      {
        // TODO: take namespace into account when validating.
        var hostContextDev = hostContext;
        validateDOMNesting$1(type, null, hostContextDev.ancestorInfo);
        if (typeof props.children === 'string' || typeof props.children === 'number') {
          var string = '' + props.children;
          var ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type, null);
          validateDOMNesting$1(null, string, ownAncestorInfo);
        }
        parentNamespace = hostContextDev.namespace;
      }
      // 创建DOM
      var domElement = createElement(type, props, rootContainerInstance, parentNamespace);
      // 设置dom属性 
      precacheFiberNode(internalInstanceHandle, domElement);
      updateFiberProps(domElement, props);
      return domElement;
    },
    appendInitialChild: function (parentInstance, child) {
      parentInstance.appendChild(child);
    },
    finalizeInitialChildren: function (domElement, type, props, rootContainerInstance) {
      setInitialProperties(domElement, type, props, rootContainerInstance);
      return shouldAutoFocusHostComponent(type, props);
    },
    prepareUpdate: function (domElement, type, oldProps, newProps, rootContainerInstance, hostContext) {
      {
        var hostContextDev = hostContext;
        if (typeof newProps.children !== typeof oldProps.children && (typeof newProps.children === 'string' || typeof newProps.children === 'number')) {
          var string = '' + newProps.children;
          var ownAncestorInfo = updatedAncestorInfo(hostContextDev.ancestorInfo, type, null);
          validateDOMNesting$1(null, string, ownAncestorInfo);
        }
      }
      return diffProperties(domElement, type, oldProps, newProps, rootContainerInstance);
    },
    shouldSetTextContent: function (type, props) {
      return type === 'textarea' || typeof props.children === 'string' || typeof props.children === 'number' || typeof props.dangerouslySetInnerHTML === 'object' && props.dangerouslySetInnerHTML !== null && typeof props.dangerouslySetInnerHTML.__html === 'string';
    },
    shouldDeprioritizeSubtree: function (type, props) {
      return !!props.hidden;
    },
    createTextInstance: function (text, rootContainerInstance, hostContext, internalInstanceHandle) {
      {
        var hostContextDev = hostContext;
        validateDOMNesting$1(null, text, hostContextDev.ancestorInfo);
      }
      var textNode = createTextNode(text, rootContainerInstance);
      precacheFiberNode(internalInstanceHandle, textNode);
      return textNode;
    },
  
  
    now: now,
  
    mutation: {
      commitMount: function (domElement, type, newProps, internalInstanceHandle) {
        // Despite the naming that might imply otherwise, this method only
        // fires if there is an `Update` effect scheduled during mounting.
        // This happens if `finalizeInitialChildren` returns `true` (which it
        // does to implement the `autoFocus` attribute on the client). But
        // there are also other cases when this might happen (such as patching
        // up text content during hydration mismatch). So we'll check this again.
        if (shouldAutoFocusHostComponent(type, newProps)) {
          domElement.focus();
        }
      },
      commitUpdate: function (domElement, updatePayload, type, oldProps, newProps, internalInstanceHandle) {
        // Update the props handle so that we know which props are the ones with
        // with current event handlers.
        updateFiberProps(domElement, newProps);
        // Apply the diff to the DOM node.
        updateProperties(domElement, updatePayload, type, oldProps, newProps);
      },
      resetTextContent: function (domElement) {
        setTextContent(domElement, '');
      },
      commitTextUpdate: function (textInstance, oldText, newText) {
        textInstance.nodeValue = newText;
      },
      appendChild: function (parentInstance, child) {
        parentInstance.appendChild(child);
      },
      appendChildToContainer: function (container, child) {
        if (container.nodeType === COMMENT_NODE) {
          container.parentNode.insertBefore(child, container);
        } else {
          container.appendChild(child);
        }
      },
      insertBefore: function (parentInstance, child, beforeChild) {
        parentInstance.insertBefore(child, beforeChild);
      },
      insertInContainerBefore: function (container, child, beforeChild) {
        if (container.nodeType === COMMENT_NODE) {
          container.parentNode.insertBefore(child, beforeChild);
        } else {
          container.insertBefore(child, beforeChild);
        }
      },
      removeChild: function (parentInstance, child) {
        parentInstance.removeChild(child);
      },
      removeChildFromContainer: function (container, child) {
        if (container.nodeType === COMMENT_NODE) {
          container.parentNode.removeChild(child);
        } else {
          container.removeChild(child);
        }
      }
    },
  
    hydration: {
      canHydrateInstance: function (instance, type, props) {
        if (instance.nodeType !== ELEMENT_NODE || type.toLowerCase() !== instance.nodeName.toLowerCase()) {
          return null;
        }
        // This has now been refined to an element node.
        return instance;
      },
      canHydrateTextInstance: function (instance, text) {
        if (text === '' || instance.nodeType !== TEXT_NODE) {
          // Empty strings are not parsed by HTML so there won't be a correct match here.
          return null;
        }
        // This has now been refined to a text node.
        return instance;
      },
      getNextHydratableSibling: function (instance) {
        var node = instance.nextSibling;
        // Skip non-hydratable nodes.
        while (node && node.nodeType !== ELEMENT_NODE && node.nodeType !== TEXT_NODE) {
          node = node.nextSibling;
        }
        return node;
      },
      getFirstHydratableChild: function (parentInstance) {
        var next = parentInstance.firstChild;
        // Skip non-hydratable nodes.
        while (next && next.nodeType !== ELEMENT_NODE && next.nodeType !== TEXT_NODE) {
          next = next.nextSibling;
        }
        return next;
      },
      hydrateInstance: function (instance, type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
        precacheFiberNode(internalInstanceHandle, instance);
        // TODO: Possibly defer this until the commit phase where all the events
        // get attached.
        updateFiberProps(instance, props);
        var parentNamespace = void 0;
        {
          var hostContextDev = hostContext;
          parentNamespace = hostContextDev.namespace;
        }
        return diffHydratedProperties(instance, type, props, parentNamespace, rootContainerInstance);
      },
      hydrateTextInstance: function (textInstance, text, internalInstanceHandle) {
        precacheFiberNode(internalInstanceHandle, textInstance);
        return diffHydratedText(textInstance, text);
      },
      didNotMatchHydratedContainerTextInstance: function (parentContainer, textInstance, text) {
        {
          warnForUnmatchedText(textInstance, text);
        }
      },
      didNotMatchHydratedTextInstance: function (parentType, parentProps, parentInstance, textInstance, text) {
        if (true && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
          warnForUnmatchedText(textInstance, text);
        }
      },
      didNotHydrateContainerInstance: function (parentContainer, instance) {
        {
          if (instance.nodeType === 1) {
            warnForDeletedHydratableElement(parentContainer, instance);
          } else {
            warnForDeletedHydratableText(parentContainer, instance);
          }
        }
      },
      didNotHydrateInstance: function (parentType, parentProps, parentInstance, instance) {
        if (true && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
          if (instance.nodeType === 1) {
            warnForDeletedHydratableElement(parentInstance, instance);
          } else {
            warnForDeletedHydratableText(parentInstance, instance);
          }
        }
      },
      didNotFindHydratableContainerInstance: function (parentContainer, type, props) {
        {
          warnForInsertedHydratedElement(parentContainer, type, props);
        }
      },
      didNotFindHydratableContainerTextInstance: function (parentContainer, text) {
        {
          warnForInsertedHydratedText(parentContainer, text);
        }
      },
      didNotFindHydratableInstance: function (parentType, parentProps, parentInstance, type, props) {
        if (true && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
          warnForInsertedHydratedElement(parentInstance, type, props);
        }
      },
      didNotFindHydratableTextInstance: function (parentType, parentProps, parentInstance, text) {
        if (true && parentProps[SUPPRESS_HYDRATION_WARNING] !== true) {
          warnForInsertedHydratedText(parentInstance, text);
        }
      }
    },
  
    scheduleDeferredCallback: rIC,
    cancelDeferredCallback: cIC
  });