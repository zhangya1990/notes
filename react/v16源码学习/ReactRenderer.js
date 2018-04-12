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
      var domElement = createElement(type, props, rootContainerInstance, parentNamespace);
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