// 处理dom节点的事件属性，添加事件
function ensureListeningTo(rootContainerElement, registrationName) {
    var isDocumentOrFragment = rootContainerElement.nodeType === DOCUMENT_NODE || rootContainerElement.nodeType === DOCUMENT_FRAGMENT_NODE;
    var doc = isDocumentOrFragment ? rootContainerElement : rootContainerElement.ownerDocument;
    listenTo(registrationName, doc);
}

// 绑定事件
function listenTo(registrationName, contentDocumentHandle) {
    var mountAt = contentDocumentHandle;
    var isListening = getListeningForDocument(mountAt);
    var dependencies = registrationNameDependencies[registrationName];

    for (var i = 0; i < dependencies.length; i++) {
        var dependency = dependencies[i];
        if (!(isListening.hasOwnProperty(dependency) && isListening[dependency])) {
            if (dependency === 'topScroll') {
                trapCapturedEvent('topScroll', 'scroll', mountAt);
            } else if (dependency === 'topFocus' || dependency === 'topBlur') {
                trapCapturedEvent('topFocus', 'focus', mountAt);
                trapCapturedEvent('topBlur', 'blur', mountAt);

                // to make sure blur and focus event listeners are only attached once
                isListening.topBlur = true;
                isListening.topFocus = true;
            } else if (dependency === 'topCancel') {
                if (isEventSupported('cancel', true)) {
                    trapCapturedEvent('topCancel', 'cancel', mountAt);
                }
                isListening.topCancel = true;
            } else if (dependency === 'topClose') {
                if (isEventSupported('close', true)) {
                    trapCapturedEvent('topClose', 'close', mountAt);
                }
                isListening.topClose = true;
            } else if (topLevelTypes.hasOwnProperty(dependency)) {
                trapBubbledEvent(dependency, topLevelTypes[dependency], mountAt);
            }

            isListening[dependency] = true;
        }
    }
}


/**
 * Traps top-level events by using event bubbling.
 *
 * @param {string} topLevelType Record from `BrowserEventConstants`.
 * @param {string} handlerBaseName Event name (e.g. "click").
 * @param {object} element Element on which to attach listener.
 * @return {?object} An object with a remove function which will forcefully
 *                  remove the listener.
 * @internal
 */
function trapBubbledEvent(topLevelType, handlerBaseName, element) {
    if (!element) {
        return null;
    }
    var dispatch = isInteractiveTopLevelEventType(topLevelType) ? dispatchInteractiveEvent : dispatchEvent;

    addEventBubbleListener(element, handlerBaseName,
        // Check if interactive and wrap in interactiveUpdates
        dispatch.bind(null, topLevelType));
}

/**
 * Traps a top-level event by using event capturing.
 *
 * @param {string} topLevelType Record from `BrowserEventConstants`.
 * @param {string} handlerBaseName Event name (e.g. "click").
 * @param {object} element Element on which to attach listener.
 * @return {?object} An object with a remove function which will forcefully
 *                  remove the listener.
 * @internal
 */
function trapCapturedEvent(topLevelType, handlerBaseName, element) {
    if (!element) {
        return null;
    }
    var dispatch = isInteractiveTopLevelEventType(topLevelType) ? dispatchInteractiveEvent : dispatchEvent;

    addEventCaptureListener(element, handlerBaseName,
        // Check if interactive and wrap in interactiveUpdates
        dispatch.bind(null, topLevelType));
}

function addEventBubbleListener(element, eventType, listener) {
    element.addEventListener(eventType, listener, false);
}

function addEventCaptureListener(element, eventType, listener) {
    element.addEventListener(eventType, listener, true);
}

function dispatchInteractiveEvent(topLevelType, nativeEvent) {
    interactiveUpdates(dispatchEvent, topLevelType, nativeEvent);
}

function interactiveUpdates(fn, a, b) {
    if (isBatchingInteractiveUpdates) {
        return fn(a, b);
    }
    // If there are any pending interactive updates, synchronously flush them.
    // This needs to happen before we read any handlers, because the effect of
    // the previous event may influence which handlers are called during
    // this event.
    if (!isBatchingUpdates && !isRendering && lowestPendingInteractiveExpirationTime !== NoWork) {
        // Synchronously flush pending interactive updates.
        performWork(lowestPendingInteractiveExpirationTime, false, null);
        lowestPendingInteractiveExpirationTime = NoWork;
    }
    var previousIsBatchingInteractiveUpdates = isBatchingInteractiveUpdates;
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingInteractiveUpdates = true;
    isBatchingUpdates = true;
    try {
        return fn(a, b);
    } finally {
        isBatchingInteractiveUpdates = previousIsBatchingInteractiveUpdates;
        isBatchingUpdates = previousIsBatchingUpdates;
        if (!isBatchingUpdates && !isRendering) {
            performSyncWork();
        }
    }
}


/* 
    @ params
    @ topLevelType 顶级事件类型 topClick 等
    @ nativeEvent event事件对象
*/

function dispatchEvent(topLevelType, nativeEvent) {
    if (!_enabled) {
        return;
    }

    // 获取事件源
    var nativeEventTarget = getEventTarget(nativeEvent);

    // 获取事件源最近的 workInProgress
    var targetInst = getClosestInstanceFromNode(nativeEventTarget);
    if (targetInst !== null && typeof targetInst.tag === 'number' && !isFiberMounted(targetInst)) {
        // If we get an event (ex: img onload) before committing that
        // component's mount, ignore it for now (that is, treat it as if it was an
        // event on a non-React tree). We might also consider queueing events and
        // dispatching them after the mount.
        targetInst = null;
    }

    // 获取一个bookKeeping
    var bookKeeping = getTopLevelCallbackBookKeeping(topLevelType, nativeEvent, targetInst);

    try {
        // Event queue being processed in the same cycle allows
        // `preventDefault`.
        batchedUpdates(handleTopLevel, bookKeeping);
    } finally {
        // 更新完成后清空该 bookKeeping
        releaseTopLevelCallbackBookKeeping(bookKeeping);
    }
}

function getEventTarget(nativeEvent) {
    var target = nativeEvent.target || window;

    // Normalize SVG <use> element events #4963
    if (target.correspondingUseElement) {
        target = target.correspondingUseElement;
    }

    // Safari may fire events on text nodes (Node.TEXT_NODE is 3).
    // @see http://www.quirksmode.org/js/events_properties.html
    return target.nodeType === TEXT_NODE ? target.parentNode : target;
}

function getClosestInstanceFromNode(node) {
    if (node[internalInstanceKey]) {
        return node[internalInstanceKey];
    }

    while (!node[internalInstanceKey]) {
        if (node.parentNode) {
            node = node.parentNode;
        } else {
            // Top of the tree. This node must not be part of a React tree (or is
            // unmounted, potentially).
            return null;
        }
    }

    var inst = node[internalInstanceKey];
    if (inst.tag === HostComponent || inst.tag === HostText) {
        // In Fiber, this will always be the deepest root.
        return inst;
    }

    return null;
}

var CALLBACK_BOOKKEEPING_POOL_SIZE = 10;
var callbackBookkeepingPool = [];

//从bookKeeping池中获取一个空的bookKeeping，并添加状态
function getTopLevelCallbackBookKeeping(topLevelType, nativeEvent, targetInst) {
    if (callbackBookkeepingPool.length) {
        var instance = callbackBookkeepingPool.pop();
        instance.topLevelType = topLevelType;
        instance.nativeEvent = nativeEvent;
        instance.targetInst = targetInst;
        return instance;
    }
    return {
        topLevelType: topLevelType,
        nativeEvent: nativeEvent,
        targetInst: targetInst,
        ancestors: []
    };
}

//重置一个bookKeeping为空，并添加到bookKeeping池中
function releaseTopLevelCallbackBookKeeping(instance) {
    instance.topLevelType = null;
    instance.nativeEvent = null;
    instance.targetInst = null;
    instance.ancestors.length = 0;
    if (callbackBookkeepingPool.length < CALLBACK_BOOKKEEPING_POOL_SIZE) {
        callbackBookkeepingPool.push(instance);
    }
}

// 执行顶级事件
function handleTopLevel(bookKeeping) {

    // 获取当前时间的workInProgress
    var targetInst = bookKeeping.targetInst;

    // Loop through the hierarchy, in case there's any nested components.
    // It's important that we build the array of ancestors before calling any
    // event handlers, because event handlers can modify the DOM, leading to
    // inconsistencies with ReactMount's node cache. See #1105.

    // 在调用事件回调函数之前，首先要追踪当前事件触发的workInProgress层级(通过添加到一个数组)，因为事件有可能会修改DOM，导致与(ReactMount's node cache)缓存中的不相同
    // 最终的数组中的顺序是从孙级到祖级排序
    var ancestor = targetInst;
    do {
        if (!ancestor) {
            bookKeeping.ancestors.push(ancestor);
            break;
        }
        // 获取根DOM节点
        var root = findRootContainerNode(ancestor);
        if (!root) {
            break;
        }
        // 添加当前 workInProgress 到数组
        bookKeeping.ancestors.push(ancestor);
        // 继续向祖级遍历，依次添加
        ancestor = getClosestInstanceFromNode(root);
    } while (ancestor);

    for (var i = 0; i < bookKeeping.ancestors.length; i++) {
        targetInst = bookKeeping.ancestors[i];
        runExtractedEventsInBatch(bookKeeping.topLevelType, targetInst, bookKeeping.nativeEvent, getEventTarget(bookKeeping.nativeEvent));
    }
}

// 批量更新
function batchedUpdates(fn, bookkeeping) {
    if (isBatching) {
        // If we are currently inside another batch, we need to wait until it
        // fully completes before restoring state.

        // 本次执行时仍有一个批量更新没有处理完，等到下一次批量更新的时候在执行 (并不是事件的回调函数不执行了，实际上事件的回调函数仍会执行，只是执行完成之后并不会立即解析更新)
        return fn(bookkeeping);
    }
    isBatching = true;
    try {
        // 效果同 fn(bookkeeping)
        return _batchedUpdates(fn, bookkeeping);
    } finally {
        // Here we wait until all updates have propagated, which is important
        // when using controlled components within layers:
        // https://github.com/facebook/react/issues/1698
        // Then we restore state of any controlled component.
        isBatching = false;

        // 是否有更新需要处理
        var controlledComponentsHavePendingUpdates = needsStateRestore();
        if (controlledComponentsHavePendingUpdates) {
            // If a controlled event was fired, we may need to restore the state of
            // the DOM node back to the controlled value. This is necessary when React
            // bails out of the update without touching the DOM.
            _flushInteractiveUpdates();
            restoreStateIfNeeded();
        }
    }
}

function _batchedUpdates(fn, a) {
    var previousIsBatchingUpdates = isBatchingUpdates;
    isBatchingUpdates = true;
    try {
        return fn(a);
    } finally {
        isBatchingUpdates = previousIsBatchingUpdates;
        if (!isBatchingUpdates && !isRendering) {
            performSyncWork();
        }
    }
}

function needsStateRestore() {
    return restoreTarget !== null || restoreQueue !== null;
}

function _flushInteractiveUpdates() {
    // lowestPendingInteractiveExpirationTime 在 computeExpirationForFiber 中如果检测到有交互更新才会赋值
    if (!isRendering && lowestPendingInteractiveExpirationTime !== NoWork) {
        // Synchronously flush pending interactive updates.
        performWork(lowestPendingInteractiveExpirationTime, false, null);
        lowestPendingInteractiveExpirationTime = NoWork;
    }
}


function restoreStateIfNeeded() {
    if (!restoreTarget) {
        return;
    }
    var target = restoreTarget;
    var queuedTargets = restoreQueue;
    restoreTarget = null;
    restoreQueue = null;

    restoreStateOfTarget(target);
    if (queuedTargets) {
        for (var i = 0; i < queuedTargets.length; i++) {
            restoreStateOfTarget(queuedTargets[i]);
        }
    }
}

function restoreStateOfTarget(target) {
    // We perform this translation at the end of the event loop so that we
    // always receive the correct fiber here
    var internalInstance = getInstanceFromNode(target);
    if (!internalInstance) {
        // Unmounted
        return;
    }
    !(fiberHostComponent && typeof fiberHostComponent.restoreControlledState === 'function') ? invariant(false, 'Fiber needs to be injected to handle a fiber target for controlled events. This error is likely caused by a bug in React. Please file an issue.') : void 0;
    var props = getFiberCurrentPropsFromNode(internalInstance.stateNode);
    fiberHostComponent.restoreControlledState(internalInstance.stateNode, internalInstance.type, props);
}

/**
* Find the deepest React component completely containing the root of the
* passed-in instance (for use when entire React trees are nested within each
* other). If React trees are not nested, returns null.
*/
// 获取根DOM节点
function findRootContainerNode(inst) {
    // TODO: It may be a good idea to cache this to prevent unnecessary DOM
    // traversal, but caching is difficult to do correctly without using a
    // mutation observer to listen for all DOM changes.
    while (inst['return']) {
        inst = inst['return'];
    }
    if (inst.tag !== HostRoot) {
        // This can happen if we're in a detached tree.
        return null;
    }
    return inst.stateNode.containerInfo;
}

// 提取事件
function extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    var events = null;
    for (var i = 0; i < plugins.length; i++) {
        // Not every plugin in the ordering may be loaded at runtime.
        var possiblePlugin = plugins[i];
        if (possiblePlugin) {
            var extractedEvents = possiblePlugin.extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
            if (extractedEvents) {
                events = accumulateInto(events, extractedEvents);
            }
        }
    }
    return events;
}

function runEventsInBatch(events, simulated) {
    if (events !== null) {
        // 将所有事件依次合并到 eventQueue 中
        eventQueue = accumulateInto(eventQueue, events);
    }

    // Set `eventQueue` to null before processing it so that we can tell if more
    // events get enqueued while processing.
    var processingEventQueue = eventQueue;
    eventQueue = null;

    if (!processingEventQueue) {
        return;
    }

    // simulated 莫不是开发组做模拟用的 ？？？？
    if (simulated) {
        forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseSimulated);
    } else {
        // 分发事件
        forEachAccumulated(processingEventQueue, executeDispatchesAndReleaseTopLevel);
    }
    !!eventQueue ? invariant(false, 'processEventQueue(): Additional events were enqueued while processing an event queue. Support for this has not yet been implemented.') : void 0;
    // This would be a good time to rethrow if any of the event handlers threw.
    ReactErrorUtils.rethrowCaughtError();
}


var executeDispatchesAndReleaseSimulated = function (e) {
    return executeDispatchesAndRelease(e, true);
};
var executeDispatchesAndReleaseTopLevel = function (e) {
    return executeDispatchesAndRelease(e, false);
};

var executeDispatchesAndRelease = function (event, simulated) {
    if (event) {
        executeDispatchesInOrder(event, simulated);

        // 分发完成之后，释放该 event 对象，性能优化
        if (!event.isPersistent()) {
            event.constructor.release(event);
        }
    }
};

/**
 * 分发事件，执行回调
 * Dispatch the event to the listener.
 * @param {SyntheticEvent} event SyntheticEvent to handle
 * @param {boolean} simulated If the event is simulated (changes exn behavior)
 * @param {function} listener Application-level callback
 * @param {*} inst Internal component instance
 */
function executeDispatch(event, simulated, listener, inst) {
    var type = event.type || 'unknown-event';
    event.currentTarget = getNodeFromInstance(inst);

    // 最终调用 invokeGuardedCallback，最终执行 listener(event)
    ReactErrorUtils.invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
    event.currentTarget = null;
}


var invokeGuardedCallback = function (name, func, context, a, b, c, d, e, f) {
    this._hasCaughtError = false;
    this._caughtError = null;
    var funcArgs = Array.prototype.slice.call(arguments, 3);
    try {
        func.apply(context, funcArgs);
    } catch (error) {
        this._caughtError = error;
        this._hasCaughtError = true;
    }
};


/**
 * Standard/simple iteration through an event's collected dispatches.
 */
// 
function executeDispatchesInOrder(event, simulated) {
    var dispatchListeners = event._dispatchListeners;
    var dispatchInstances = event._dispatchInstances;
    {
        validateEventDispatches(event);
    }
    if (Array.isArray(dispatchListeners)) {
        for (var i = 0; i < dispatchListeners.length; i++) {

            // 阻止事件冒泡
            if (event.isPropagationStopped()) {
                break;
            }

            // Listeners and Instances are two parallel arrays that are always in sync.
            executeDispatch(event, simulated, dispatchListeners[i], dispatchInstances[i]);
        }
    } else if (dispatchListeners) {
        executeDispatch(event, simulated, dispatchListeners, dispatchInstances);
    }
    event._dispatchListeners = null;
    event._dispatchInstances = null;
}


function runExtractedEventsInBatch(topLevelType, targetInst, nativeEvent, nativeEventTarget) {
    // 解析获取事件
    var events = extractEvents(topLevelType, targetInst, nativeEvent, nativeEventTarget);
    // 执行
    runEventsInBatch(events, false);
}

var BeforeInputEventPlugin = {
    eventTypes: eventTypes,

    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        var composition = extractCompositionEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);

        var beforeInput = extractBeforeInputEvent(topLevelType, targetInst, nativeEvent, nativeEventTarget);

        if (composition === null) {
            return beforeInput;
        }

        if (beforeInput === null) {
            return composition;
        }

        return [composition, beforeInput];
    }
};

var ChangeEventPlugin = {
    eventTypes: eventTypes$1,

    _isInputEventSupported: isInputEventSupported,

    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        var targetNode = targetInst ? getNodeFromInstance$1(targetInst) : window;

        var getTargetInstFunc = void 0,
            handleEventFunc = void 0;
        if (shouldUseChangeEvent(targetNode)) {
            getTargetInstFunc = getTargetInstForChangeEvent;
        } else if (isTextInputElement(targetNode)) {
            if (isInputEventSupported) {
                getTargetInstFunc = getTargetInstForInputOrChangeEvent;
            } else {
                getTargetInstFunc = getTargetInstForInputEventPolyfill;
                handleEventFunc = handleEventsForInputEventPolyfill;
            }
        } else if (shouldUseClickEvent(targetNode)) {
            getTargetInstFunc = getTargetInstForClickEvent;
        }

        if (getTargetInstFunc) {
            var inst = getTargetInstFunc(topLevelType, targetInst);
            if (inst) {
                var event = createAndAccumulateChangeEvent(inst, nativeEvent, nativeEventTarget);
                return event;
            }
        }

        if (handleEventFunc) {
            handleEventFunc(topLevelType, targetNode, targetInst);
        }

        // When blurring, set the value attribute for number inputs
        if (topLevelType === 'topBlur') {
            handleControlledInputBlur(targetInst, targetNode);
        }
    }
};

var EnterLeaveEventPlugin = {
    eventTypes: eventTypes$2,

    /**
     * For almost every interaction we care about, there will be both a top-level
     * `mouseover` and `mouseout` event that occurs. Only use `mouseout` so that
     * we do not extract duplicate events. However, moving the mouse into the
     * browser from outside will not fire a `mouseout` event. In this case, we use
     * the `mouseover` top-level event.
     */
    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        if (topLevelType === 'topMouseOver' && (nativeEvent.relatedTarget || nativeEvent.fromElement)) {
            return null;
        }
        if (topLevelType !== 'topMouseOut' && topLevelType !== 'topMouseOver') {
            // Must not be a mouse in or mouse out - ignoring.
            return null;
        }

        var win = void 0;
        if (nativeEventTarget.window === nativeEventTarget) {
            // `nativeEventTarget` is probably a window object.
            win = nativeEventTarget;
        } else {
            // TODO: Figure out why `ownerDocument` is sometimes undefined in IE8.
            var doc = nativeEventTarget.ownerDocument;
            if (doc) {
                win = doc.defaultView || doc.parentWindow;
            } else {
                win = window;
            }
        }

        var from = void 0;
        var to = void 0;
        if (topLevelType === 'topMouseOut') {
            from = targetInst;
            var related = nativeEvent.relatedTarget || nativeEvent.toElement;
            to = related ? getClosestInstanceFromNode(related) : null;
        } else {
            // Moving to a node from outside the window.
            from = null;
            to = targetInst;
        }

        if (from === to) {
            // Nothing pertains to our managed components.
            return null;
        }

        var fromNode = from == null ? win : getNodeFromInstance$1(from);
        var toNode = to == null ? win : getNodeFromInstance$1(to);

        var leave = SyntheticMouseEvent.getPooled(eventTypes$2.mouseLeave, from, nativeEvent, nativeEventTarget);
        leave.type = 'mouseleave';
        leave.target = fromNode;
        leave.relatedTarget = toNode;

        var enter = SyntheticMouseEvent.getPooled(eventTypes$2.mouseEnter, to, nativeEvent, nativeEventTarget);
        enter.type = 'mouseenter';
        enter.target = toNode;
        enter.relatedTarget = fromNode;

        accumulateEnterLeaveDispatches(leave, enter, from, to);

        return [leave, enter];
    }
};

var SimpleEventPlugin = {
    eventTypes: eventTypes$4,

    isInteractiveTopLevelEventType: function (topLevelType) {
        var config = topLevelEventsToDispatchConfig[topLevelType];
        return config !== undefined && config.isInteractive === true;
    },


    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        var dispatchConfig = topLevelEventsToDispatchConfig[topLevelType];
        if (!dispatchConfig) {
            return null;
        }
        var EventConstructor = void 0;
        switch (topLevelType) {
            case 'topKeyPress':
                // Firefox creates a keypress event for function keys too. This removes
                // the unwanted keypress events. Enter is however both printable and
                // non-printable. One would expect Tab to be as well (but it isn't).
                if (getEventCharCode(nativeEvent) === 0) {
                    return null;
                }
            /* falls through */
            case 'topKeyDown':
            case 'topKeyUp':
                EventConstructor = SyntheticKeyboardEvent;
                break;
            case 'topBlur':
            case 'topFocus':
                EventConstructor = SyntheticFocusEvent;
                break;
            case 'topClick':
                // Firefox creates a click event on right mouse clicks. This removes the
                // unwanted click events.
                if (nativeEvent.button === 2) {
                    return null;
                }
            /* falls through */
            case 'topDoubleClick':
            case 'topMouseDown':
            case 'topMouseMove':
            case 'topMouseUp':
            // TODO: Disabled elements should not respond to mouse events
            /* falls through */
            case 'topMouseOut':
            case 'topMouseOver':
            case 'topContextMenu':
                EventConstructor = SyntheticMouseEvent;
                break;
            case 'topDrag':
            case 'topDragEnd':
            case 'topDragEnter':
            case 'topDragExit':
            case 'topDragLeave':
            case 'topDragOver':
            case 'topDragStart':
            case 'topDrop':
                EventConstructor = SyntheticDragEvent;
                break;
            case 'topTouchCancel':
            case 'topTouchEnd':
            case 'topTouchMove':
            case 'topTouchStart':
                EventConstructor = SyntheticTouchEvent;
                break;
            case 'topAnimationEnd':
            case 'topAnimationIteration':
            case 'topAnimationStart':
                EventConstructor = SyntheticAnimationEvent;
                break;
            case 'topTransitionEnd':
                EventConstructor = SyntheticTransitionEvent;
                break;
            case 'topScroll':
                EventConstructor = SyntheticUIEvent;
                break;
            case 'topWheel':
                EventConstructor = SyntheticWheelEvent;
                break;
            case 'topCopy':
            case 'topCut':
            case 'topPaste':
                EventConstructor = SyntheticClipboardEvent;
                break;
            default:
                {
                    if (knownHTMLTopLevelTypes.indexOf(topLevelType) === -1) {
                        warning(false, 'SimpleEventPlugin: Unhandled event type, `%s`. This warning ' + 'is likely caused by a bug in React. Please file an issue.', topLevelType);
                    }
                }
                // HTML Events
                // @see http://www.w3.org/TR/html5/index.html#events-0
                EventConstructor = SyntheticEvent$1;
                break;
        }
        // 获取当前 workInProgress 的所有事件
        var event = EventConstructor.getPooled(dispatchConfig, targetInst, nativeEvent, nativeEventTarget);
        // 解析分发事件，执行完成之后 每个event 会包含 _dispatchListeners _dispatchInstances 属性，均为数组，分别表示当前event触发的回调（从捕获到冒泡）和触发回调的 workInProgress （从捕获到冒泡）
        accumulateTwoPhaseDispatches(event);
        return event;
    }
};

var SelectEventPlugin = {
    eventTypes: eventTypes$3,

    extractEvents: function (topLevelType, targetInst, nativeEvent, nativeEventTarget) {
        var doc = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget.document : nativeEventTarget.nodeType === DOCUMENT_NODE ? nativeEventTarget : nativeEventTarget.ownerDocument;
        // Track whether all listeners exists for this plugin. If none exist, we do
        // not extract events. See #3639.
        if (!doc || !isListeningToAllDependencies('onSelect', doc)) {
            return null;
        }

        var targetNode = targetInst ? getNodeFromInstance$1(targetInst) : window;

        switch (topLevelType) {
            // Track the input node that has focus.
            case 'topFocus':
                if (isTextInputElement(targetNode) || targetNode.contentEditable === 'true') {
                    activeElement$1 = targetNode;
                    activeElementInst$1 = targetInst;
                    lastSelection = null;
                }
                break;
            case 'topBlur':
                activeElement$1 = null;
                activeElementInst$1 = null;
                lastSelection = null;
                break;
            // Don't fire the event while the user is dragging. This matches the
            // semantics of the native select event.
            case 'topMouseDown':
                mouseDown = true;
                break;
            case 'topContextMenu':
            case 'topMouseUp':
                mouseDown = false;
                return constructSelectEvent(nativeEvent, nativeEventTarget);
            // Chrome and IE fire non-standard event when selection is changed (and
            // sometimes when it hasn't). IE's event fires out of order with respect
            // to key and input events on deletion, so we discard it.
            //
            // Firefox doesn't support selectionchange, so check selection status
            // after each key entry. The selection changes after keydown and before
            // keyup, but we check on keydown as well in the case of holding down a
            // key, when multiple keydown events are fired but only one keyup is.
            // This is also our approach for IE handling, for the reason above.
            case 'topSelectionChange':
                if (skipSelectionChangeEvent) {
                    break;
                }
            // falls through
            case 'topKeyDown':
            case 'topKeyUp':
                return constructSelectEvent(nativeEvent, nativeEventTarget);
        }

        return null;
    }
};

// 解析分发事件
function accumulateTwoPhaseDispatches(events) {
    // 遍历事件并解析分发
    forEachAccumulated(events, accumulateTwoPhaseDispatchesSingle);
}

// 分发单个事件
function accumulateTwoPhaseDispatchesSingle(event) {
    if (event && event.dispatchConfig.phasedRegistrationNames) {
        // 按照事件的捕获阶段和冒泡阶段分别解析事件
        traverseTwoPhase(event._targetInst, accumulateDirectionalDispatches, event);
    }
}

// 追踪两个阶段(捕获，冒泡)
function traverseTwoPhase(inst, fn, arg) {
    var path = [];
    while (inst) {
        path.push(inst);
        inst = getParent(inst);
    }
    var i = void 0;
    // 从祖级元素开始遍历，触发捕获
    for (i = path.length; i-- > 0;) {
        fn(path[i], 'captured', arg);
    }
    // 从当前元素开始向祖级遍历，触发冒泡
    for (i = 0; i < path.length; i++) {
        fn(path[i], 'bubbled', arg);
    }
}

/**
* @param {array} arr an "accumulation" of items which is either an Array or
* a single item. Useful when paired with the `accumulate` module. This is a
* simple utility that allows us to reason about a collection of items, but
* handling the case when there is exactly one item (and we do not need to
* allocate an array).
* @param {function} cb Callback invoked with each element or a collection.
* @param {?} [scope] Scope used as `this` in a callback.
*/
// 遍历事件并分发
function forEachAccumulated(arr, cb, scope) {
    if (Array.isArray(arr)) {
        arr.forEach(cb, scope);
    } else if (arr) {
        cb.call(scope, arr);
    }
}


/*  分发单个方向事件(捕获或者冒泡)
    @ params
    @ inst 当前的workInProgress
    @ phase 事件的阶段 captured | bubbled
    @ event 当前的事件对象
*/
function accumulateDirectionalDispatches(inst, phase, event) {
    {
        warning(inst, 'Dispatching inst must not be null');
    }
    // 获取当前 workInProgress 对当前的event 在当前事件阶段 的listener  - -！
    var listener = listenerAtPhase(inst, event, phase);
    if (listener) {
        // 累积所有的listners和instance
        event._dispatchListeners = accumulateInto(event._dispatchListeners, listener);
        event._dispatchInstances = accumulateInto(event._dispatchInstances, inst);
    }
}

function listenerAtPhase(inst, event, propagationPhase) {
    var registrationName = event.dispatchConfig.phasedRegistrationNames[propagationPhase];
    return getListener(inst, registrationName);
}

/**
* @param {object} inst The instance, which is the source of events.
* @param {string} registrationName Name of listener (e.g. `onClick`).
* @return {?function} The stored callback.
*/
function getListener(inst, registrationName) {
    var listener = void 0;

    // TODO: shouldPreventMouseEvent is DOM-specific and definitely should not
    // live here; needs to be moved to a better place soon
    var stateNode = inst.stateNode;
    if (!stateNode) {
        // Work in progress (ex: onload events in incremental mode).
        return null;
    }
    var props = getFiberCurrentPropsFromNode(stateNode);
    if (!props) {
        // Work in progress.
        return null;
    }
    listener = props[registrationName];
    if (shouldPreventMouseEvent(registrationName, inst.type, props)) {
        return null;
    }
    !(!listener || typeof listener === 'function') ? invariant(false, 'Expected `%s` listener to be a function, instead got a value of `%s` type.', registrationName, typeof listener) : void 0;
    return listener;
}


/**
* Accumulates items that must not be null or undefined into the first one. This
* is used to conserve memory by avoiding array allocations, and thus sacrifices
* API cleanness. Since `current` can be null before being passed in and not
* null after this function, make sure to assign it back to `current`:
*
* `a = accumulateInto(a, b);`
*
* This API should be sparingly used. Try `accumulate` for something cleaner.
*
* @return {*|array<*>} An accumulation of items.
*/

function accumulateInto(current, next) {
    !(next != null) ? invariant(false, 'accumulateInto(...): Accumulated items must not be null or undefined.') : void 0;

    if (current == null) {
        return next;
    }

    // Both are not empty. Warning: Never call x.concat(y) when you are not
    // certain that x is an Array (x could be a string with concat method).
    if (Array.isArray(current)) {
        if (Array.isArray(next)) {
            current.push.apply(current, next);
            return current;
        }
        current.push(next);
        return current;
    }

    if (Array.isArray(next)) {
        // A bit too dangerous to mutate `next`.
        return [current].concat(next);
    }

    return [current, next];
}