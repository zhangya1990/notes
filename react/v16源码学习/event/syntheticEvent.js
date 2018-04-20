/**
 * Summary of `ReactBrowserEventEmitter` event handling:
 *
 *  - Top-level delegation is used to trap most native browser events. This
 *    may only occur in the main thread and is the responsibility of
 *    ReactDOMEventListener, which is injected and can therefore support
 *    pluggable event sources. This is the only work that occurs in the main
 *    thread.
 *
 *  - We normalize and de-duplicate events to account for browser quirks. This
 *    may be done in the worker thread.
 *
 *  - Forward these native events (with the associated top-level type used to
 *    trap it) to `EventPluginHub`, which in turn will ask plugins if they want
 *    to extract any synthetic events.
 *
 *  - The `EventPluginHub` will then process each event by annotating them with
 *    "dispatches", a sequence of listeners and IDs that care about that event.
 *
 *  - The `EventPluginHub` then dispatches the events.
 *
 * Overview of React and the event system:
 *
 * +------------+    .
 * |    DOM     |    .
 * +------------+    .
 *       |           .
 *       v           .
 * +------------+    .
 * | ReactEvent |    .
 * |  Listener  |    .
 * +------------+    .                         +-----------+
 *       |           .               +--------+|SimpleEvent|
 *       |           .               |         |Plugin     |
 * +-----|------+    .               v         +-----------+
 * |     |      |    .    +--------------+                    +------------+
 * |     +-----------.--->|EventPluginHub|                    |    Event   |
 * |            |    .    |              |     +-----------+  | Propagators|
 * | ReactEvent |    .    |              |     |TapEvent   |  |------------|
 * |  Emitter   |    .    |              |<---+|Plugin     |  |other plugin|
 * |            |    .    |              |     +-----------+  |  utilities |
 * |     +-----------.--->|              |                    +------------+
 * |     |      |    .    +--------------+
 * +-----|------+    .                ^        +-----------+
 *       |           .                |        |Enter/Leave|
 *       +           .                +-------+|Plugin     |
 * +-------------+   .                         +-----------+
 * | application |   .
 * |-------------|   .
 * |             |   .
 * |             |   .
 * +-------------+   .
 *                   .
 *    React Core     .  General Purpose Event Plugin System
 */






var EventInterface = {
    type: null,
    target: null,
    // currentTarget is set when dispatching; no use in copying it here
    currentTarget: emptyFunction.thatReturnsNull,
    eventPhase: null,
    bubbles: null,
    cancelable: null,
    timeStamp: function (event) {
      return event.timeStamp || Date.now();
    },
    defaultPrevented: null,
    isTrusted: null
  };
  
  var shouldBeReleasedProperties = ['dispatchConfig', '_targetInst', 'nativeEvent', 'isDefaultPrevented', 'isPropagationStopped', '_dispatchListeners', '_dispatchInstances'];


  /**
   * Synthetic events are dispatched by event plugins, typically in response to a
   * top-level event delegation handler.
   *
   * These systems should generally use pooling to reduce the frequency of garbage
   * collection. The system should check `isPersistent` to determine whether the
   * event should be released into the pool after being dispatched. Users that
   * need a persisted event should invoke `persist`.
   *
   * Synthetic events (and subclasses) implement the DOM Level 3 Events API by
   * normalizing browser quirks. Subclasses do not necessarily have to implement a
   * DOM interface; custom application-specific events can also subclass this.
   *
   * @param {object} dispatchConfig Configuration used to dispatch this event.
   * @param {*} targetInst Marker identifying the event target.  当前的 workInProgress
   * @param {object} nativeEvent Native browser event.  触发本次事件的事件对象
   * @param {DOMEventTarget} nativeEventTarget Target node. 触发本次事件的事件源（DOM）
   */
  function SyntheticEvent(dispatchConfig, targetInst, nativeEvent, nativeEventTarget) {
    {
      // these have a getter/setter for warnings
      delete this.nativeEvent;
      delete this.preventDefault;
      delete this.stopPropagation;
    }
  
    this.dispatchConfig = dispatchConfig;
    this._targetInst = targetInst;
    this.nativeEvent = nativeEvent;
  
    var Interface = this.constructor.Interface;
    for (var propName in Interface) {
      if (!Interface.hasOwnProperty(propName)) {
        continue;
      }
      {
        delete this[propName]; // this has a getter/setter for warnings
      }
      var normalize = Interface[propName];
      if (normalize) {
        this[propName] = normalize(nativeEvent);
      } else {
        if (propName === 'target') {
          this.target = nativeEventTarget;
        } else {
          this[propName] = nativeEvent[propName];
        }
      }
    }
  
    var defaultPrevented = nativeEvent.defaultPrevented != null ? nativeEvent.defaultPrevented : nativeEvent.returnValue === false;
    if (defaultPrevented) {
      // 返回 true 的空函数
      this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
    } else {
      // 返回 false 的空函数
      this.isDefaultPrevented = emptyFunction.thatReturnsFalse;
    }
    // 默认返回false
    this.isPropagationStopped = emptyFunction.thatReturnsFalse;
    return this;
  }
  
  _assign(SyntheticEvent.prototype, {
    preventDefault: function () {
      this.defaultPrevented = true;
      var event = this.nativeEvent;
      if (!event) {
        return;
      }
  
      if (event.preventDefault) {
        event.preventDefault();
      } else if (typeof event.returnValue !== 'unknown') {
        event.returnValue = false;
      }
      this.isDefaultPrevented = emptyFunction.thatReturnsTrue;
    },
  
    stopPropagation: function () {
      var event = this.nativeEvent;
      if (!event) {
        return;
      }
  
      if (event.stopPropagation) {
        event.stopPropagation();
      } else if (typeof event.cancelBubble !== 'unknown') {
        // The ChangeEventPlugin registers a "propertychange" event for
        // IE. This event does not support bubbling or cancelling, and
        // any references to cancelBubble throw "Member not found".  A
        // typeof check of "unknown" circumvents this issue (and is also
        // IE specific).
        event.cancelBubble = true;
      }
  
      this.isPropagationStopped = emptyFunction.thatReturnsTrue;
    },
  
    /**
     * We release all dispatched `SyntheticEvent`s after each event loop, adding
     * them back into the pool. This allows a way to hold onto a reference that
     * won't be added back into the pool.
     */

     // 当一个事件循环完成之后，会清空所有已经分发过的事件，并将它们添加到事件池中，因此在各种事件的回调函数中，异步获取event对象将获取不到，通过persist方法，可以在内存中保存对该事件对象的引用
    persist: function () {
      this.isPersistent = emptyFunction.thatReturnsTrue;
    },
  
    /**
     * Checks if this event should be released back into the pool.
     *
     * @return {boolean} True if this should not be released, false otherwise.
     */
    isPersistent: emptyFunction.thatReturnsFalse,
  
    /**
     * `PooledClass` looks for `destructor` on each instance it releases.
     */
    // 重置各种乱七八糟的属性为null，空函数等等
    destructor: function () {
      var Interface = this.constructor.Interface;
      for (var propName in Interface) {
        {
          Object.defineProperty(this, propName, getPooledWarningPropertyDefinition(propName, Interface[propName]));
        }
      }
      for (var i = 0; i < shouldBeReleasedProperties.length; i++) {
        this[shouldBeReleasedProperties[i]] = null;
      }
      {
        Object.defineProperty(this, 'nativeEvent', getPooledWarningPropertyDefinition('nativeEvent', null));
        Object.defineProperty(this, 'preventDefault', getPooledWarningPropertyDefinition('preventDefault', emptyFunction));
        Object.defineProperty(this, 'stopPropagation', getPooledWarningPropertyDefinition('stopPropagation', emptyFunction));
      }
    }
  });
  
  SyntheticEvent.Interface = EventInterface;
  
  /**
   * Helper to reduce boilerplate when creating subclasses.
   */
  SyntheticEvent.extend = function (Interface) {
    var Super = this;
  
    var E = function () {};
    E.prototype = Super.prototype;
    var prototype = new E();
  
    function Class() {
      return Super.apply(this, arguments);
    }
    _assign(prototype, Class.prototype);
    Class.prototype = prototype;
    Class.prototype.constructor = Class;
  
    Class.Interface = _assign({}, Super.Interface, Interface);
    Class.extend = Super.extend;
    addEventPoolingTo(Class);
  
    return Class;
  };
  

  function addEventPoolingTo(EventConstructor) {
    EventConstructor.eventPool = [];
    EventConstructor.getPooled = getPooledEvent;
    EventConstructor.release = releasePooledEvent;
  }

  // 获取一个event实例
function getPooledEvent(dispatchConfig, targetInst, nativeEvent, nativeInst) {
  var EventConstructor = this;
  if (EventConstructor.eventPool.length) {
      var instance = EventConstructor.eventPool.pop();
      EventConstructor.call(instance, dispatchConfig, targetInst, nativeEvent, nativeInst);
      return instance;
  }
  return new EventConstructor(dispatchConfig, targetInst, nativeEvent, nativeInst);
}

  // 释放一个event实例
function releasePooledEvent(event) {
  var EventConstructor = this;
  !(event instanceof EventConstructor) ? invariant(false, 'Trying to release an event instance  into a pool of a different type.') : void 0;
  event.destructor();
  if (EventConstructor.eventPool.length < EVENT_POOL_SIZE) {
    EventConstructor.eventPool.push(event);
  }
}

function getPooledWarningPropertyDefinition(propName, getVal) {
  var isFunction = typeof getVal === 'function';
  return {
    configurable: true,
    set: set,
    get: get
  };

  function set(val) {
    var action = isFunction ? 'setting the method' : 'setting the property';
    warn(action, 'This is effectively a no-op');
    return val;
  }

  function get() {
    var action = isFunction ? 'accessing the method' : 'accessing the property';
    var result = isFunction ? 'This is a no-op function' : 'This is set to null';
    warn(action, result);
    return getVal;
  }

  function warn(action, result) {
    var warningCondition = false;
    warning(warningCondition, "This synthetic event is reused for performance reasons. If you're seeing this, " + "you're %s `%s` on a released/nullified synthetic event. %s. " + 'If you must keep the original synthetic event around, use event.persist(). ' + 'See https://fb.me/react-event-pooling for more information.', action, propName, result);
  }
}