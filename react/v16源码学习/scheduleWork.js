// 调度任务
// expirationTime为期望的任务到期时间
function scheduleWork(fiber, expirationTime: ExpirationTime) {
    return scheduleWorkImpl(fiber, expirationTime, false);
}


function scheduleWorkImpl(fiber, expirationTime, isErrorRecovery) {

    // 记录本次调度更新情况
    recordScheduleUpdate();

    var node = fiber;
    while (node !== null) {
        // Walk the parent path to the root and update each node's
        // expiration time.
        // 向上遍历至根组件fiber实例，并依次更新expirationTime到期时间
        if (node.expirationTime === NoWork || node.expirationTime > expirationTime) {
            node.expirationTime = expirationTime;
        }
        // 同时更新alternate fiber的到期时间
        if (node.alternate !== null) {
            if (node.alternate.expirationTime === NoWork || node.alternate.expirationTime > expirationTime) {
                node.alternate.expirationTime = expirationTime;
            }
        }
        // node.return为空，说明到达组件树顶部
        if (node['return'] === null) {
            if (node.tag === HostRoot) {
                // 确保是组件树根组件并获取FiberRoot实例
                var root = node.stateNode;


                // 没有在任务处理的过程中，并且当前调度的任务优先级比本次计算所得的最高优先级还高（一个脱离了低级趣味的fiber）
                if (!isWorking && nextRenderExpirationTime !== NoWork && expirationTime < nextRenderExpirationTime) {
                    // This is an interruption. (Used for performance tracking.)
                    // 记录当前的fiber,当前的loop处理完成之后在做特殊处理
                    interruptedBy = fiber;
                    resetStack();
                }



                // 如果当前正在渲染阶段，停止调度更新，除非当前root与正在渲染的root不同
                if (
                    // If we're in the render phase, we don't need to schedule this root
                    // for an update, because we'll do it before we exit...

                    // 当前没有正在处理的任务 或者 存在正在处理的任务但是正在提交，还没有渲染 或者 正在渲染另外一个root，满足这样的情况才处理当前任务
                    !isWorking || isCommitting ||
                    // ...unless this is a different root than the one we're rendering.
                    nextRoot !== root) {
                    // Add this root to the root schedule.

                    // 请求处理任务
                    requestWork(root, expirationTime);
                }

                // happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate,死循环警告
                if (nestedUpdateCount > NESTED_UPDATE_LIMIT) {
                    invariant(false, 'Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.');
                }
            } else {
                {
                    if (!isErrorRecovery && fiber.tag === ClassComponent) {
                        warnAboutUpdateOnUnmounted(fiber);
                    }
                }
                return;
            }
        }
        node = node['return'];
    }
}

function recordScheduleUpdate() {

    // 允许用户时间什么鬼api，默认为ture，从未置为false，？？？
    if (enableUserTimingAPI) {

        if (isCommitting) {
            // 当前正处于提交跟新阶段
            hasScheduledUpdateInCurrentCommit = true;
        }
        if (currentPhase !== null && currentPhase !== 'componentWillMount' && currentPhase !== 'componentWillReceiveProps') {
            // 当前没有处于componentWillMount和componentWillReceiveProps钩子函数中，(暂时理解为 在这连个阶段中不做更新处理)
            hasScheduledUpdateInCurrentPhase = true;
        }
    }
}

// requestWork is called by the scheduler whenever a root receives an update.
// It's up to the renderer to call renderRoot at some point in the future.

// 当一个fiberRoot对象接收到一次更新时调度器调用requestWork
function requestWork(root, expirationTime) {
    //将当前fiberRoot对象添加给调度器
    addRootToSchedule(root, expirationTime);

    if (isRendering) {
        // Prevent reentrancy. Remaining work will be scheduled at the end of
        // the currently rendering batch.
        // 如果当前正在处理一个fiberRoot对象(提交、渲染)，停止本次任务请求
        return;
    }

    if (isBatchingUpdates) {
        //  正在批量更新

        // Flush work at the end of the batch.
        if (isUnbatchingUpdates) {
            // ...unless we're inside unbatchedUpdates, in which case we should
            // flush it now.

            // 本次批量更新已经完成，同步更新当前root，并把优先级提升为Sync等级
            nextFlushedRoot = root;
            nextFlushedExpirationTime = Sync;
            performWorkOnRoot(root, Sync, false);
        }
        return;
    }

    // TODO: Get rid of Sync and use current time?
    // 同步更新优先级
    if (expirationTime === Sync) {
        performSyncWork();
    } else {
        scheduleCallbackWithExpiration(expirationTime);
    }
}


function addRootToSchedule(root, expirationTime) {
    // Add the root to the schedule.
    // Check if this root is already part of the schedule.

    // 检查该root对象是否已经调度过
    if (root.nextScheduledRoot === null) {
        // This root is not already scheduled. Add it.
        // 当前root还没有被调度过,添加任务到期时间
        root.remainingExpirationTime = expirationTime;

        if (lastScheduledRoot === null) {
            //调度器首次执行，firstScheduledRoot（第一次调度的root），lastScheduledRoot（上一次调度处理(findHighestPriorityRoot中也对lastScheduledRoot操作赋值)的root）赋值，root.nextScheduledRoot赋值，表明当前root已被调度过
            firstScheduledRoot = lastScheduledRoot = root;
            root.nextScheduledRoot = root;
        } else {
            //调度器已经调度过其他root，调度当前root，首先给将当前root添加到上次调度的root顺序后面，root.nextScheduledRoot 赋值为 firstScheduledRoot，即所有root调度完成之后，调度器重新返回第一次调度的root
            lastScheduledRoot.nextScheduledRoot = root;
            lastScheduledRoot = root;
            lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
        }
    } else {
        // This root is already scheduled, but its priority may have increased.
        // 当前root对象已经被调度过，但是过期时间有可能需要调整
        var remainingExpirationTime = root.remainingExpirationTime;
        if (remainingExpirationTime === NoWork || expirationTime < remainingExpirationTime) {
            // Update the priority.
            // 任务剩余到期时间大于期望的任务到期时间，修改任务到期时间
            root.remainingExpirationTime = expirationTime;
        }
    }
}

function performSyncWork() {
    performWork(Sync, false, null);
}

function performWork(minExpirationTime, isAsync, dl) {

    //dl只有执行异步任务的时候才会存在 ？？？ （可能并不准确）
    deadline = dl;

    // Keep working on roots until there's no more work, or until the we reach
    // the deadline.
    // 获取最高优先级root及相应的过期时间
    findHighestPriorityRoot();

    // 异步任务，暂时忽略 ？？？ ( enableUserTimingAPI 开发环境为true ， 开发环境下会连续触发两次渲染 ？？？ 以排除错误)
    if (enableUserTimingAPI && deadline !== null) {
        var didExpire = nextFlushedExpirationTime < recalculateCurrentTime();
        var timeout = expirationTimeToMs(nextFlushedExpirationTime);
        stopRequestCallbackTimer(didExpire, timeout);
    }

    if (isAsync) {
        while (nextFlushedRoot !== null && nextFlushedExpirationTime !== NoWork && (minExpirationTime === NoWork || minExpirationTime >= nextFlushedExpirationTime) && (!deadlineDidExpire || recalculateCurrentTime() >= nextFlushedExpirationTime)) {
            performWorkOnRoot(nextFlushedRoot, nextFlushedExpirationTime, !deadlineDidExpire);
            findHighestPriorityRoot();
        }
    } else {
        while (nextFlushedRoot !== null && nextFlushedExpirationTime !== NoWork && (minExpirationTime === NoWork || minExpirationTime >= nextFlushedExpirationTime)) {
            // 如果当前调度器中存在比期望优先级更高的任务，优先执行该任务，然后依次执行
            performWorkOnRoot(nextFlushedRoot, nextFlushedExpirationTime, false);
            findHighestPriorityRoot();
        }
    }

    // We're done flushing work. Either we ran out of time in this callback,
    // or there's no more work left with sufficient priority.

    // If we're inside a callback, set this to false since we just completed it.
    if (deadline !== null) {
        callbackExpirationTime = NoWork;
        callbackID = -1;
    }
    // If there's work left over, schedule a new callback.
    if (nextFlushedExpirationTime !== NoWork) {
        scheduleCallbackWithExpiration(nextFlushedExpirationTime);
    }

    // Clean-up.
    deadline = null;
    deadlineDidExpire = false;

    finishRendering();
}

// 获取最高优先级root
function findHighestPriorityRoot() {
    var highestPriorityWork = NoWork;
    var highestPriorityRoot = null;
    if (lastScheduledRoot !== null) {

        // previousScheduledRoot 上一次获取优先级处理的有效root (remainingExpirationTime !== NoWork)
        var previousScheduledRoot = lastScheduledRoot;
        var root = firstScheduledRoot;
        // 从firstRoot开始，依次处理
        while (root !== null) {
            var remainingExpirationTime = root.remainingExpirationTime;
            if (remainingExpirationTime === NoWork) {

                // This root no longer has work. Remove it from the scheduler.
                // 当前root的过期时间为0，即当前root任务已经完成，从调度器中移除
                !(previousScheduledRoot !== null && lastScheduledRoot !== null) ? invariant(false, 'Should have a previous and last root. This error is likely caused by a bug in React. Please file an issue.') : void 0;
                if (root === root.nextScheduledRoot) {
                    // This is the only root in the list.
                    // 当前root和下一个root相同，说明链表中只有当前调度的root，移除当前root之后，链表全部处理完成，清空当前root状态，并且重置 firstScheduledRoot，lastScheduledRoot 为空
                    root.nextScheduledRoot = null;
                    firstScheduledRoot = lastScheduledRoot = null;
                    break;
                } else if (root === firstScheduledRoot) {
                    // This is the first root in the list.
                    // 当前root是链表中第一个root，重置firstScheduledRoot为当前root的下一个root，清空当前root状态
                    var next = root.nextScheduledRoot;
                    firstScheduledRoot = next;
                    lastScheduledRoot.nextScheduledRoot = next;
                    root.nextScheduledRoot = null;
                } else if (root === lastScheduledRoot) {
                    // This is the last root in the list.
                    // 当前root和上一次调度的root相同，移除当前root，并且将指针指向firstScheduledRoot
                    lastScheduledRoot = previousScheduledRoot;
                    lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
                    root.nextScheduledRoot = null;
                    break;
                } else {
                    previousScheduledRoot.nextScheduledRoot = root.nextScheduledRoot;
                    root.nextScheduledRoot = null;
                }
                root = previousScheduledRoot.nextScheduledRoot;
            } else {
                if (highestPriorityWork === NoWork || remainingExpirationTime < highestPriorityWork) {
                    // Update the priority, if it's higher
                    // 找到优先级最高的root，获取优先级最高的过期时间
                    highestPriorityWork = remainingExpirationTime;
                    highestPriorityRoot = root;
                }
                if (root === lastScheduledRoot) {
                    break;
                }
                previousScheduledRoot = root;
                root = root.nextScheduledRoot;
            }
        }
    }

    // If the next root is the same as the previous root, this is a nested
    // update. To prevent an infinite loop, increment the nested update count.

    // 上次获取的最高优先级root与本次相同，说明嵌套更新，计算 update count 避免死循环
    var previousFlushedRoot = nextFlushedRoot;
    if (previousFlushedRoot !== null && previousFlushedRoot === highestPriorityRoot && highestPriorityWork === Sync) {
        nestedUpdateCount++;
    } else {
        // Reset whenever we switch roots.
        nestedUpdateCount = 0;
    }


    nextFlushedRoot = highestPriorityRoot;
    nextFlushedExpirationTime = highestPriorityWork;
}


function performWorkOnRoot(root, expirationTime, isAsync) {

    // 大渲染阶段开始(内部包括调和更新阶段，提交阶段和真正的渲染阶段，个人认为 isPerformingWork 更合适)
    isRendering = true;

    // Check if this is async work or sync/expired work.
    // 同步任务或者异步过期任务
    if (!isAsync) {
        // Flush sync work.
        var finishedWork = root.finishedWork;
        if (finishedWork !== null) {
            // This root is already complete. We can commit it.
            completeRoot(root, finishedWork, expirationTime);
        } else {
            root.finishedWork = null;
            finishedWork = renderRoot(root, expirationTime, false);
            if (finishedWork !== null) {
                // We've completed the root. Commit it.
                completeRoot(root, finishedWork, expirationTime);
            }
        }
    } else {
        // Flush async work.
        var _finishedWork = root.finishedWork;
        if (_finishedWork !== null) {
            // This root is already complete. We can commit it.
            completeRoot(root, _finishedWork, expirationTime);
        } else {
            root.finishedWork = null;
            _finishedWork = renderRoot(root, expirationTime, true);
            if (_finishedWork !== null) {
                // We've completed the root. Check the deadline one more time
                // before committing.
                if (!shouldYield()) {
                    // Still time left. Commit the root.
                    completeRoot(root, _finishedWork, expirationTime);
                } else {
                    // There's no time left. Mark this root as complete. We'll come
                    // back and commit it later.
                    root.finishedWork = _finishedWork;
                }
            }
        }
    }

    // 渲染结束
    isRendering = false;
}

// 调和更新root,获取最终渲染任务fiber(解析更新任务，个人理解为调度器任务完成，执行权交给更新器)
function renderRoot(root, expirationTime, isAsync) {

    // 任务正在执行(更新器正在工作)
    isWorking = true;

    // Check if we're starting from a fresh stack, or if we're resuming from
    // previously yielded work.
    // 检查是否是一个新的任务，或者恢复一个等待的任务,首次执行时nextRoot为null，同样执行
    if (expirationTime !== nextRenderExpirationTime || root !== nextRoot || nextUnitOfWork === null) {
        // Reset the stack and start working from the root.
        // 重置stack并且从当前root开始任务
        resetStack();

        // 重新设置nextRoot和nextRenderExpirationTime
        nextRoot = root;
        nextRenderExpirationTime = expirationTime;
        //创建当前fiber的workInProgress，并赋值过期时间为当前期望过期时间
        nextUnitOfWork = createWorkInProgress(nextRoot.current, null, nextRenderExpirationTime);
        // 取消当前root等待过期时间(已处理)
        root.pendingCommitExpirationTime = NoWork;
    }

    // 处理过程是否出现错误
    var didFatal = false;

    // 赋值 currentFiber = nextUnitOfWork,记录开始调和 (React Tree Reconciliation)
    startWorkLoopTimer(nextUnitOfWork);

    do {
        try {
            workLoop(isAsync);
        } catch (thrownValue) {
            if (nextUnitOfWork === null) {
                // This is a fatal error.
                didFatal = true;
                onUncaughtError(thrownValue);
                break;
            }

            if (true && replayFailedUnitOfWorkWithInvokeGuardedCallback) {
                var failedUnitOfWork = nextUnitOfWork;
                replayUnitOfWork(failedUnitOfWork, isAsync);
            }

            var sourceFiber = nextUnitOfWork;
            var returnFiber = sourceFiber['return'];
            if (returnFiber === null) {
                // This is the root. The root could capture its own errors. However,
                // we don't know if it errors before or after we pushed the host
                // context. This information is needed to avoid a stack mismatch.
                // Because we're not sure, treat this as a fatal error. We could track
                // which phase it fails in, but doesn't seem worth it. At least
                // for now.
                didFatal = true;
                onUncaughtError(thrownValue);
                break;
            }
            throwException(returnFiber, sourceFiber, thrownValue);
            nextUnitOfWork = completeUnitOfWork(sourceFiber);
        }
        break;
    } while (true);

    // We're done performing work. Time to clean up.
    // 本次调和完成，清空本次调和的时间点记录
    stopWorkLoopTimer(interruptedBy);
    interruptedBy = null;
    isWorking = false;

    // Yield back to main thread.
    if (didFatal) {
        // There was a fatal error.
        {
            stack.resetStackAfterFatalErrorInDev();
        }
        return null;
    } else if (nextUnitOfWork === null) {
        // We reached the root.
        if (isRootReadyForCommit) {
            // The root successfully completed. It's ready for commit.
            root.pendingCommitExpirationTime = expirationTime;
            var finishedWork = root.current.alternate;
            return finishedWork;
        } else {
            // The root did not complete.
            invariant(false, 'Expired work should have completed. This error is likely caused by a bug in React. Please file an issue.');
        }
    } else {
        // There's more work to do, but we ran out of time. Yield back to
        // the renderer.
        return null;
    }
}

function resetStack() {

    // 如果存在下一个任务单元
    if (nextUnitOfWork !== null) {
        var interruptedWork = nextUnitOfWork['return'];
        while (interruptedWork !== null) {
            unwindInterruptedWork(interruptedWork);
            interruptedWork = interruptedWork['return'];
        }
    }

    // 警告暂时忽略，需求空的stack
    {
        ReactStrictModeWarnings.discardPendingWarnings();
        stack.checkThatStackIsEmpty();
    }

    // 重置 nextRoot，nextRenderExpirationTime，nextUnitOfWork，isRootReadyForCommit
    nextRoot = null;
    nextRenderExpirationTime = NoWork;
    nextUnitOfWork = null;

    isRootReadyForCommit = false;
}

// 创建一个 workInProgress (工作任务)
function createWorkInProgress(current, pendingProps, expirationTime) {
    var workInProgress = current.alternate;
    if (workInProgress === null) {
        // We use a double buffering pooling technique because we know that we'll
        // only ever need at most two versions of a tree. We pool the "other" unused
        // node that we're free to reuse. This is lazily created to avoid allocating
        // extra objects for things that are never updated. It also allow us to
        // reclaim the extra memory if needed.
        workInProgress = createFiber(current.tag, pendingProps, current.key, current.mode);
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;

        {
            // DEV-only fields
            workInProgress._debugID = current._debugID;
            workInProgress._debugSource = current._debugSource;
            workInProgress._debugOwner = current._debugOwner;
        }

        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps;

        // We already have an alternate.
        // Reset the effect tag.
        workInProgress.effectTag = NoEffect;

        // The effect list is no longer valid.
        workInProgress.nextEffect = null;
        workInProgress.firstEffect = null;
        workInProgress.lastEffect = null;
    }

    workInProgress.expirationTime = expirationTime;

    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;

    // These will be overridden during the parent's reconciliation
    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;
    workInProgress.ref = current.ref;

    return workInProgress;
}

// 开启本次调和时间节点记录
function startWorkLoopTimer(nextUnitOfWork) {

    // 开发环境相关，暂时不做考虑(用于调试目的？？？)
    if (enableUserTimingAPI) {
        currentFiber = nextUnitOfWork;
        if (!supportsUserTiming) {
            return;
        }

        // 本次 任务loop中的commit计数器
        commitCountInCurrentWorkLoop = 0;
        // This is top level call.
        // Any other measurements are performed within.
        // 记录开始调和React Tree
        beginMark('(React Tree Reconciliation)');

        // Resume any measurements that were in progress during the last loop.
        // 恢复上一次任务循环中的当前组件的 mark 和 measure
        resumeTimers();
    }
}


// 清空本次调和时间节点记录
function stopWorkLoopTimer(interruptedBy) {
    if (enableUserTimingAPI) {
        // 不支持perfermance api
        if (!supportsUserTiming) {
            return;
        }
        var warning$$1 = null;

        // 记录是哪个任性的组件出了问题(应该是react性能分析用的，白tmd分析了这么长时间)
        if (interruptedBy !== null) {
            if (interruptedBy.tag === HostRoot) {
                warning$$1 = 'A top-level update interrupted the previous render';
            } else {
                var componentName = getComponentName(interruptedBy) || 'Unknown';
                warning$$1 = 'An update to ' + componentName + ' interrupted the previous render';
            }
        } else if (commitCountInCurrentWorkLoop > 1) {
            warning$$1 = 'There were cascading updates';
        }
        commitCountInCurrentWorkLoop = 0;
        // Pause any measurements until the next loop.
        pauseTimers();
        endMark('(React Tree Reconciliation)', '(React Tree Reconciliation)', warning$$1);
    }
}


// 遍历fiber任务
function workLoop(isAsync) {
    if (!isAsync) {
        // Flush all expired work.
        while (nextUnitOfWork !== null) {
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        }
    } else {
        // Flush asynchronous work until the deadline runs out of time.
        while (nextUnitOfWork !== null && !shouldYield()) {
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        }
    }
}

// 执行单元任务
function performUnitOfWork(workInProgress) {
    // console.log(workInProgress)
    // The current, flushed, state of this fiber is the alternate.
    // Ideally nothing should rely on this, but relying on it here
    // means that we don't need an additional field on the work in
    // progress.

    // 获取当前workInProgress的稳定fiber对象,首次渲染时为fiberRoot对应的fiber对象
    var current = workInProgress.alternate;

    // See if beginning this work spawns more work.

    // TMD 再说一遍 debug相关的一律忽略不管
    startWorkTimer(workInProgress);

    // TMD debug相关的一律忽略不管
    /* {
        ReactDebugCurrentFiber.setCurrentFiber(workInProgress);
    }

    if (true && replayFailedUnitOfWorkWithInvokeGuardedCallback) {
        stashedWorkInProgressProperties = _assign({}, workInProgress);
    } */

    var next = beginWork(current, workInProgress, nextRenderExpirationTime);

    /* {
        ReactDebugCurrentFiber.resetCurrentFiber();
    }
    if (true && ReactFiberInstrumentation_1.debugTool) {
        ReactFiberInstrumentation_1.debugTool.onBeginWork(workInProgress);
    } */

    if (next === null) {
        // If this doesn't spawn new work, complete the current work.

        // 如果没有子级的fiber，完成当前任务
        next = completeUnitOfWork(workInProgress);
    }

    ReactCurrentOwner.current = null;

    return next;
}

//根据组件类型调用不同方法，这些方法内调用更新器API将更新添加至更新队列
function beginWork(current, workInProgress, renderExpirationTime) {

    // ForwardRef 相关，有兴趣的时候再研究
    if (workInProgress.tag === ForwardRef) {
        console.log(current)
        console.log(workInProgress)
    }

    // 当前workInProgress已经处理过或  优先级低于当前需要处理的最高优先级 ？？？ 暂时没明白，先考虑正常情况
    if (workInProgress.expirationTime === NoWork || workInProgress.expirationTime > renderExpirationTime) {
        return bailoutOnLowPriority(current, workInProgress);
    }

    // 首次运行任务，tag === HostRoot ，详见 ./updateMethods/*
    switch (workInProgress.tag) {
        case IndeterminateComponent:
            return mountIndeterminateComponent(current, workInProgress, renderExpirationTime);
        case FunctionalComponent:
            return updateFunctionalComponent(current, workInProgress);
        case ClassComponent:
            // 处理 class 组件
            return updateClassComponent(current, workInProgress, renderExpirationTime);
            // 首次插入，处理container
        case HostRoot:
            return updateHostRoot(current, workInProgress, renderExpirationTime);
        case HostComponent:
            return updateHostComponent(current, workInProgress, renderExpirationTime);
        case HostText:
            return updateHostText(current, workInProgress);
        case CallHandlerPhase:
            // This is a restart. Reset the tag to the initial phase.
            workInProgress.tag = CallComponent;
        // Intentionally fall through since this is now the same.
        case CallComponent:
            return updateCallComponent(current, workInProgress, renderExpirationTime);
        case ReturnComponent:
            // A return component is just a placeholder, we can just run through the
            // next one immediately.
            return null;
        case HostPortal:
            return updatePortalComponent(current, workInProgress, renderExpirationTime);
        case ForwardRef:
            return updateForwardRef(current, workInProgress);
        case Fragment:
            return updateFragment(current, workInProgress);
        case Mode:
            return updateMode(current, workInProgress);
        case ContextProvider:
            return updateContextProvider(current, workInProgress, renderExpirationTime);
        case ContextConsumer:
            return updateContextConsumer(current, workInProgress, renderExpirationTime);
        default:
            invariant(false, 'Unknown unit of work tag. This error is likely caused by a bug in React. Please file an issue.');
    }
}

function completeUnitOfWork(workInProgress) {
    // Attempt to complete the current unit of work, then move to the
    // next sibling. If there are no more siblings, return to the
    // parent fiber.
    while (true) {
      // The current, flushed, state of this fiber is the alternate.
      // Ideally nothing should rely on this, but relying on it here
      // means that we don't need an additional field on the work in
      // progress.
      var current = workInProgress.alternate;
      {
        ReactDebugCurrentFiber.setCurrentFiber(workInProgress);
      }

      var returnFiber = workInProgress['return'];
      var siblingFiber = workInProgress.sibling;

      if ((workInProgress.effectTag & Incomplete) === NoEffect) {
        // This fiber completed.
        var next = completeWork(current, workInProgress, nextRenderExpirationTime);
        stopWorkTimer(workInProgress);
        resetExpirationTime(workInProgress, nextRenderExpirationTime);
        {
          ReactDebugCurrentFiber.resetCurrentFiber();
        }

        if (next !== null) {
          stopWorkTimer(workInProgress);
          if (true && ReactFiberInstrumentation_1.debugTool) {
            ReactFiberInstrumentation_1.debugTool.onCompleteWork(workInProgress);
          }
          // If completing this work spawned new work, do that next. We'll come
          // back here again.
          return next;
        }

        if (returnFiber !== null &&
        // Do not append effects to parents if a sibling failed to complete
        (returnFiber.effectTag & Incomplete) === NoEffect) {
          // Append all the effects of the subtree and this fiber onto the effect
          // list of the parent. The completion order of the children affects the
          // side-effect order.
          if (returnFiber.firstEffect === null) {
            returnFiber.firstEffect = workInProgress.firstEffect;
          }
          if (workInProgress.lastEffect !== null) {
            if (returnFiber.lastEffect !== null) {
              returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
            }
            returnFiber.lastEffect = workInProgress.lastEffect;
          }

          // If this fiber had side-effects, we append it AFTER the children's
          // side-effects. We can perform certain side-effects earlier if
          // needed, by doing multiple passes over the effect list. We don't want
          // to schedule our own side-effect on our own list because if end up
          // reusing children we'll schedule this effect onto itself since we're
          // at the end.
          var effectTag = workInProgress.effectTag;
          // Skip both NoWork and PerformedWork tags when creating the effect list.
          // PerformedWork effect is read by React DevTools but shouldn't be committed.
          if (effectTag > PerformedWork) {
            if (returnFiber.lastEffect !== null) {
              returnFiber.lastEffect.nextEffect = workInProgress;
            } else {
              returnFiber.firstEffect = workInProgress;
            }
            returnFiber.lastEffect = workInProgress;
          }
        }

        if (true && ReactFiberInstrumentation_1.debugTool) {
          ReactFiberInstrumentation_1.debugTool.onCompleteWork(workInProgress);
        }

        if (siblingFiber !== null) {
          // If there is more work to do in this returnFiber, do that next.
          return siblingFiber;
        } else if (returnFiber !== null) {
          // If there's no more work in this returnFiber. Complete the returnFiber.
          workInProgress = returnFiber;
          continue;
        } else {
          // We've reached the root.
          isRootReadyForCommit = true;
          return null;
        }
      } else {
        // This fiber did not complete because something threw. Pop values off
        // the stack without entering the complete phase. If this is a boundary,
        // capture values if possible.
        var _next = unwindWork(workInProgress);
        // Because this fiber did not complete, don't reset its expiration time.
        if (workInProgress.effectTag & DidCapture) {
          // Restarting an error boundary
          stopFailedWorkTimer(workInProgress);
        } else {
          stopWorkTimer(workInProgress);
        }

        {
          ReactDebugCurrentFiber.resetCurrentFiber();
        }

        if (_next !== null) {
          stopWorkTimer(workInProgress);
          if (true && ReactFiberInstrumentation_1.debugTool) {
            ReactFiberInstrumentation_1.debugTool.onCompleteWork(workInProgress);
          }
          // If completing this work spawned new work, do that next. We'll come
          // back here again.
          // Since we're restarting, remove anything that is not a host effect
          // from the effect tag.
          _next.effectTag &= HostEffectMask;
          return _next;
        }

        if (returnFiber !== null) {
          // Mark the parent fiber as incomplete and clear its effect list.
          returnFiber.firstEffect = returnFiber.lastEffect = null;
          returnFiber.effectTag |= Incomplete;
        }

        if (true && ReactFiberInstrumentation_1.debugTool) {
          ReactFiberInstrumentation_1.debugTool.onCompleteWork(workInProgress);
        }

        if (siblingFiber !== null) {
          // If there is more work to do in this returnFiber, do that next.
          return siblingFiber;
        } else if (returnFiber !== null) {
          // If there's no more work in this returnFiber. Complete the returnFiber.
          workInProgress = returnFiber;
          continue;
        } else {
          return null;
        }
      }
    }

    // Without this explicit null return Flow complains of invalid return type
    // TODO Remove the above while(true) loop
    // eslint-disable-next-line no-unreachable
    return null;
  }