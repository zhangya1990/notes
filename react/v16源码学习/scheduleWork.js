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
    // 更新任务执行完成之后任然有剩余的任务，调度一个新的回调处理，即推迟到下一个 requestIdleCallback 处理
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
        // 当所有的任务单元都处理完成之后，如果满足提交条件，提交当前的workInProgress
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

        // 如果没有子级的fiber，完成当前任务，当前fiber完成之后，如果还有兄弟节点，继续处理兄弟节点
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

// 完成任务单元调和
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
            // 将当前fiber转化为DOM，并插入document中
            var next = completeWork(current, workInProgress, nextRenderExpirationTime);
            stopWorkTimer(workInProgress);
            // 重新设置 workInProgress 的过期时间
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

                // 递归将当前fiber的副作用链添加到父级fiber，由子级副作用的完成顺序决定副作用链的顺序
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

                // 如果当前的fiber本身也包含副作用，将fiber添加到副作用连的末尾
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
                // 如果有兄弟节点，继续处理兄弟节点
                return siblingFiber;
            } else if (returnFiber !== null) {
                // If there's no more work in this returnFiber. Complete the returnFiber.
                // 其次递归处理父级节点
                workInProgress = returnFiber;
                continue;
            } else {
                // We've reached the root.
                // 当所有都处理完成之后，标识符标记为true，提交更新
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


function completeWork(current, workInProgress, renderExpirationTime) {
    var newProps = workInProgress.pendingProps;
    switch (workInProgress.tag) {
        case FunctionalComponent:
            return null;
        case ClassComponent:
            {
                // We are leaving this subtree, so pop context if any.
                popLegacyContextProvider(workInProgress);

                // If this component caught an error, schedule an error log effect.
                var instance = workInProgress.stateNode;
                var updateQueue = workInProgress.updateQueue;
                if (updateQueue !== null && updateQueue.capturedValues !== null) {
                    workInProgress.effectTag &= ~DidCapture;
                    if (typeof instance.componentDidCatch === 'function') {
                        workInProgress.effectTag |= ErrLog;
                    } else {
                        // Normally we clear this in the commit phase, but since we did not
                        // schedule an effect, we need to reset it here.
                        updateQueue.capturedValues = null;
                    }
                }
                return null;
            }
        case HostRoot:
            {
                popHostContainer(workInProgress);
                popTopLevelLegacyContextObject(workInProgress);
                var fiberRoot = workInProgress.stateNode;
                if (fiberRoot.pendingContext) {
                    fiberRoot.context = fiberRoot.pendingContext;
                    fiberRoot.pendingContext = null;
                }
                if (current === null || current.child === null) {
                    // If we hydrated, pop so that we can delete any remaining children
                    // that weren't hydrated.
                    popHydrationState(workInProgress);
                    // This resets the hacky state to fix isMounted before committing.
                    // TODO: Delete this when we delete isMounted and findDOMNode.
                    workInProgress.effectTag &= ~Placement;
                }
                updateHostContainer(workInProgress);

                var _updateQueue = workInProgress.updateQueue;
                if (_updateQueue !== null && _updateQueue.capturedValues !== null) {
                    workInProgress.effectTag |= ErrLog;
                }
                return null;
            }
        case HostComponent:
            {
                popHostContext(workInProgress);
                var rootContainerInstance = getRootHostContainer();
                var type = workInProgress.type;
                if (current !== null && workInProgress.stateNode != null) {
                    // If we have an alternate, that means this is an update and we need to
                    // schedule a side-effect to do the updates.
                    var oldProps = current.memoizedProps;
                    // If we get updated because one of our children updated, we don't
                    // have newProps so we'll have to reuse them.
                    // TODO: Split the update API as separate for the props vs. children.
                    // Even better would be if children weren't special cased at all tho.
                    var _instance = workInProgress.stateNode;
                    var currentHostContext = getHostContext();
                    // TODO: Experiencing an error where oldProps is null. Suggests a host
                    // component is hitting the resume path. Figure out why. Possibly
                    // related to `hidden`.
                    var updatePayload = prepareUpdate(_instance, type, oldProps, newProps, rootContainerInstance, currentHostContext);

                    updateHostComponent(current, workInProgress, updatePayload, type, oldProps, newProps, rootContainerInstance, currentHostContext);

                    if (current.ref !== workInProgress.ref) {
                        markRef(workInProgress);
                    }
                } else {
                    // 首次插入，生成DOM

                    if (!newProps) {
                        !(workInProgress.stateNode !== null) ? invariant(false, 'We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.') : void 0;
                        // This can happen when we abort work.
                        return null;
                    }

                    var _currentHostContext = getHostContext();
                    // TODO: Move createInstance to beginWork and keep it on a context
                    // "stack" as the parent. Then append children as we go in beginWork
                    // or completeWork depending on we want to add then top->down or
                    // bottom->up. Top->down is faster in IE11.
                    var wasHydrated = popHydrationState(workInProgress);
                    if (wasHydrated) {
                        // TODO: Move this and createInstance step into the beginPhase
                        // to consolidate.
                        if (prepareToHydrateHostInstance(workInProgress, rootContainerInstance, _currentHostContext)) {
                            // If changes to the hydrated node needs to be applied at the
                            // commit-phase we mark this as such.
                            markUpdate(workInProgress);
                        }
                    } else {
                        // 创建dom, createInstance 方法 ./ReactRenderer.js
                        var _instance2 = createInstance(type, newProps, rootContainerInstance, _currentHostContext, workInProgress);

                        // 依次添加子节点
                        appendAllChildren(_instance2, workInProgress);

                        // Certain renderers require commit-time effects for initial mount.
                        // (eg DOM renderer supports auto-focus for certain elements).
                        // Make sure such renderers get scheduled for later work.
                        if (finalizeInitialChildren(_instance2, type, newProps, rootContainerInstance, _currentHostContext)) {
                            markUpdate(workInProgress);
                        }
                        workInProgress.stateNode = _instance2;
                    }

                    if (workInProgress.ref !== null) {
                        // If there is a ref on a host node we need to schedule a callback
                        markRef(workInProgress);
                    }
                }
                return null;
            }
        case HostText:
            {
                var newText = newProps;
                if (current && workInProgress.stateNode != null) {
                    var oldText = current.memoizedProps;
                    // If we have an alternate, that means this is an update and we need
                    // to schedule a side-effect to do the updates.
                    updateHostText(current, workInProgress, oldText, newText);
                } else {
                    if (typeof newText !== 'string') {
                        !(workInProgress.stateNode !== null) ? invariant(false, 'We must have new props for new mounts. This error is likely caused by a bug in React. Please file an issue.') : void 0;
                        // This can happen when we abort work.
                        return null;
                    }
                    var _rootContainerInstance = getRootHostContainer();
                    var _currentHostContext2 = getHostContext();
                    var _wasHydrated = popHydrationState(workInProgress);
                    if (_wasHydrated) {
                        if (prepareToHydrateHostTextInstance(workInProgress)) {
                            markUpdate(workInProgress);
                        }
                    } else {
                        workInProgress.stateNode = createTextInstance(newText, _rootContainerInstance, _currentHostContext2, workInProgress);
                    }
                }
                return null;
            }
        case CallComponent:
            return moveCallToHandlerPhase(current, workInProgress, renderExpirationTime);
        case CallHandlerPhase:
            // Reset the tag to now be a first phase call.
            workInProgress.tag = CallComponent;
            return null;
        case ReturnComponent:
            // Does nothing.
            return null;
        case ForwardRef:
            return null;
        case Fragment:
            return null;
        case Mode:
            return null;
        case HostPortal:
            popHostContainer(workInProgress);
            updateHostContainer(workInProgress);
            return null;
        case ContextProvider:
            // Pop provider fiber
            popProvider(workInProgress);
            return null;
        case ContextConsumer:
            return null;
        // Error cases
        case IndeterminateComponent:
            invariant(false, 'An indeterminate component should have become determinate before completing. This error is likely caused by a bug in React. Please file an issue.');
        // eslint-disable-next-line no-fallthrough
        default:
            invariant(false, 'Unknown unit of work tag. This error is likely caused by a bug in React. Please file an issue.');
    }
}

function completeRoot(root, finishedWork, expirationTime) {
    // Check if there's a batch that matches this expiration time.
    var firstBatch = root.firstBatch;
    if (firstBatch !== null && firstBatch._expirationTime <= expirationTime) {
        if (completedBatches === null) {
            completedBatches = [firstBatch];
        } else {
            completedBatches.push(firstBatch);
        }
        if (firstBatch._defer) {
            // This root is blocked from committing by a batch. Unschedule it until
            // we receive another update.
            root.finishedWork = finishedWork;
            root.remainingExpirationTime = NoWork;
            return;
        }
    }

    // Commit the root.
    root.finishedWork = null;
    root.remainingExpirationTime = commitRoot(finishedWork);
}

function commitRoot(finishedWork) {
    isWorking = true;
    isCommitting = true;
    startCommitTimer();

    var root = finishedWork.stateNode;
    !(root.current !== finishedWork) ? invariant(false, 'Cannot commit the same tree as before. This is probably a bug related to the return field. This error is likely caused by a bug in React. Please file an issue.') : void 0;
    var committedExpirationTime = root.pendingCommitExpirationTime;
    !(committedExpirationTime !== NoWork) ? invariant(false, 'Cannot commit an incomplete root. This error is likely caused by a bug in React. Please file an issue.') : void 0;
    root.pendingCommitExpirationTime = NoWork;

    var currentTime = recalculateCurrentTime();

    // Reset this to null before calling lifecycles
    ReactCurrentOwner.current = null;

    var firstEffect = void 0;
    if (finishedWork.effectTag > PerformedWork) {
        // A fiber's effect list consists only of its children, not itself. So if
        // the root has an effect, we need to add it to the end of the list. The
        // resulting list is the set that would belong to the root's parent, if
        // it had one; that is, all the effects in the tree including the root.

        // fiber 的副作用链仅包括子节点的副作用，并不包含它自己。如果fiberRoot也包含一个副作用，将它添加到副作用链的末尾
        if (finishedWork.lastEffect !== null) {
            finishedWork.lastEffect.nextEffect = finishedWork;
            firstEffect = finishedWork.firstEffect;
        } else {
            firstEffect = finishedWork;
        }
    } else {
        // There is no effect on the root.
        firstEffect = finishedWork.firstEffect;
    }

    // dom 更新之前 保存事件状态
    prepareForCommit(root.containerInfo);

    // Invoke instances of getSnapshotBeforeUpdate before mutation.
    nextEffect = firstEffect;
    startCommitSnapshotEffectsTimer();
    while (nextEffect !== null) {
        var didError = false;
        var error = void 0;
        {
            // 调用 commitBeforeMutationLifecycles，下面定义
            invokeGuardedCallback$2(null, commitBeforeMutationLifecycles, null);
            if (hasCaughtError()) {
                didError = true;
                error = clearCaughtError();
            }
        }
        if (didError) {
            !(nextEffect !== null) ? invariant(false, 'Should have next effect. This error is likely caused by a bug in React. Please file an issue.') : void 0;
            onCommitPhaseError(nextEffect, error);
            // Clean-up
            if (nextEffect !== null) {
                nextEffect = nextEffect.nextEffect;
            }
        }
    }
    stopCommitSnapshotEffectsTimer();

    // Commit all the side-effects within a tree. We'll do this in two passes.
    // The first pass performs all the host insertions, updates, deletions and
    // ref unmounts.

    // 两次遍历 side-effects tree
    // 第一次处理dom的插入，更新，删除以及 unmounts ref  (删除时会触发 componentWillUnmount钩子)
    nextEffect = firstEffect;
    startCommitHostEffectsTimer();
    while (nextEffect !== null) {
        var _didError = false;
        var _error = void 0;
        {
            invokeGuardedCallback$2(null, commitAllHostEffects, null);
            if (hasCaughtError()) {
                _didError = true;
                _error = clearCaughtError();
            }
        }
        if (_didError) {
            !(nextEffect !== null) ? invariant(false, 'Should have next effect. This error is likely caused by a bug in React. Please file an issue.') : void 0;
            onCommitPhaseError(nextEffect, _error);
            // Clean-up
            if (nextEffect !== null) {
                nextEffect = nextEffect.nextEffect;
            }
        }
    }
    stopCommitHostEffectsTimer();

    // 恢复事件状态
    resetAfterCommit(root.containerInfo);

    // The work-in-progress tree is now the current tree. This must come after
    // the first pass of the commit phase, so that the previous tree is still
    // current during componentWillUnmount, but before the second pass, so that
    // the finished work is current during componentDidMount/Update.
    root.current = finishedWork;

    // In the second pass we'll perform all life-cycles and ref callbacks.
    // Life-cycles happen as a separate pass so that all placements, updates,
    // and deletions in the entire tree have already been invoked.
    // This pass also triggers any renderer-specific initial effects.

    // 第二次运行时，所有的dom修改都已经完成(增，删，改),触发相应的钩子函数 componentDidMount componentDidUpdate ，或者处理 input 元素的自动聚焦等副作用

    nextEffect = firstEffect;
    startCommitLifeCyclesTimer();
    while (nextEffect !== null) {
        var _didError2 = false;
        var _error2 = void 0;
        {
            // 调用生命周期钩子
            invokeGuardedCallback$2(null, commitAllLifeCycles, null, root, currentTime, committedExpirationTime);
            if (hasCaughtError()) {
                _didError2 = true;
                _error2 = clearCaughtError();
            }
        }
        if (_didError2) {
            !(nextEffect !== null) ? invariant(false, 'Should have next effect. This error is likely caused by a bug in React. Please file an issue.') : void 0;
            onCommitPhaseError(nextEffect, _error2);
            if (nextEffect !== null) {
                nextEffect = nextEffect.nextEffect;
            }
        }
    }

    // 提交阶段完成，本次任务完成
    isCommitting = false;
    isWorking = false;
    stopCommitLifeCyclesTimer();
    stopCommitTimer();

    // onCommitRoot 钩子执行
    if (typeof onCommitRoot === 'function') {
        onCommitRoot(finishedWork.stateNode);
    }
    if (true && ReactFiberInstrumentation_1.debugTool) {
        ReactFiberInstrumentation_1.debugTool.onCommitWork(finishedWork);
    }

    var remainingTime = root.current.expirationTime;
    if (remainingTime === NoWork) {
        // If there's no remaining work, we can clear the set of already failed
        // error boundaries.
        legacyErrorBoundariesThatAlreadyFailed = null;
    }
    return remainingTime;
}


function commitBeforeMutationLifecycles() {

    // 依次调用 组件树的 getSnapshotBeforeUpdate 钩子函数
    while (nextEffect !== null) {
        var effectTag = nextEffect.effectTag;

        if (effectTag & Snapshot) {
            //记录提交次数
            recordEffect();

            var current = nextEffect.alternate;
            _commitBeforeMutationLifeCycles(current, nextEffect);
        }

        // Don't cleanup effects yet;
        // This will be done by commitAllLifeCycles()
        nextEffect = nextEffect.nextEffect;
    }
}

function _commitBeforeMutationLifeCycles(current, finishedWork) {
    switch (finishedWork.tag) {
        case ClassComponent:
            {
                if (finishedWork.effectTag & Snapshot) {
                    if (current !== null) {
                        var prevProps = current.memoizedProps;
                        var prevState = current.memoizedState;

                        // currentPhaseFiber = fiber;currentPhase = phase;
                        startPhaseTimer(finishedWork, 'getSnapshotBeforeUpdate');

                        var _instance = finishedWork.stateNode;
                        _instance.props = finishedWork.memoizedProps;
                        _instance.state = finishedWork.memoizedState;

                        // 调用组件实例实例的getSnapshotBeforeUpdate钩子
                        var snapshot = _instance.getSnapshotBeforeUpdate(prevProps, prevState);
                        {
                            var didWarnSet = didWarnAboutUndefinedSnapshotBeforeUpdate;
                            if (snapshot === undefined && !didWarnSet.has(finishedWork.type)) {
                                didWarnSet.add(finishedWork.type);
                                warning(false, '%s.getSnapshotBeforeUpdate(): A snapshot value (or null) ' + 'must be returned. You have returned undefined.', getComponentName(finishedWork));
                            }
                        }

                        // 将钩子执行结果添加给组件实例，作为componentDidUpdate钩子函数的第三个参数
                        _instance.__reactInternalSnapshotBeforeUpdate = snapshot;
                        stopPhaseTimer();
                    }
                }
                return;
            }
        case HostRoot:
        case HostComponent:
        case HostText:
        case HostPortal:
            // Nothing to do for these component types
            return;
        default:
            {
                invariant(false, 'This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.');
            }
    }
}

// 处理所有的 host effects
function commitAllHostEffects() {
    while (nextEffect !== null) {
        {
            ReactDebugCurrentFiber.setCurrentFiber(nextEffect);
        }
        recordEffect();

        var effectTag = nextEffect.effectTag;

        if (effectTag & ContentReset) {
            // 清空 content
            commitResetTextContent(nextEffect);
        }

        if (effectTag & Ref) {
            // 解绑 ref
            var current = nextEffect.alternate;
            if (current !== null) {
                commitDetachRef(current);
            }
        }

        // The following switch statement is only concerned about placement,
        // updates, and deletions. To avoid needing to add a case for every
        // possible bitmap value, we remove the secondary effects from the
        // effect tag and switch on that value.
        var primaryEffectTag = effectTag & (Placement | Update | Deletion);
        switch (primaryEffectTag) {
            case Placement:
                {
                    // 插入dom
                    commitPlacement(nextEffect);
                    // Clear the "placement" from effect tag so that we know that this is inserted, before
                    // any life-cycles like componentDidMount gets called.
                    // TODO: findDOMNode doesn't rely on this any more but isMounted
                    // does and isMounted is deprecated anyway so we should be able
                    // to kill this.
                    nextEffect.effectTag &= ~Placement;
                    break;
                }
            case PlacementAndUpdate:
                {
                    // Placement
                    commitPlacement(nextEffect);
                    // Clear the "placement" from effect tag so that we know that this is inserted, before
                    // any life-cycles like componentDidMount gets called.
                    nextEffect.effectTag &= ~Placement;

                    // Update
                    var _current = nextEffect.alternate;
                    // 更新DOM updateProperties(domElement, updatePayload, type, oldProps, newProps) (更改dom属性 文本节点内容等) 以及修改 node[internalEventHandlersKey] = props 追踪事件
                    commitWork(_current, nextEffect);
                    break;
                }
            case Update:
                {
                    var _current2 = nextEffect.alternate;
                    commitWork(_current2, nextEffect);
                    break;
                }
            case Deletion:
                {
                    // Recursively delete all host nodes from the parent.
                    // Detach refs and call componentWillUnmount() on the whole subtree.
                    // 递归删除dom，清除 ref ，触发 componentWillUnmount() 钩子
                    commitDeletion(nextEffect);
                    break;
                }
        }
        nextEffect = nextEffect.nextEffect;
    }

    {
        ReactDebugCurrentFiber.resetCurrentFiber();
    }
}

function commitAllLifeCycles(finishedRoot, currentTime, committedExpirationTime) {
    {
        ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings();

        if (warnAboutDeprecatedLifecycles) {
            ReactStrictModeWarnings.flushPendingDeprecationWarnings();
        }
    }
    while (nextEffect !== null) {
        var effectTag = nextEffect.effectTag;

        if (effectTag & (Update | Callback)) {
            recordEffect();
            var current = nextEffect.alternate;
            // 按照副作用链依次触发 componentDidMount 或 componentDidUpdate生命周期函数 
            commitLifeCycles(finishedRoot, current, nextEffect, currentTime, committedExpirationTime);
        }

        if (effectTag & ErrLog) {
            commitErrorLogging(nextEffect, onUncaughtError);
        }

        if (effectTag & Ref) {
            recordEffect();
            commitAttachRef(nextEffect);
        }

        var next = nextEffect.nextEffect;
        // Ensure that we clean these up so that we don't accidentally keep them.
        // I'm not actually sure this matters because we can't reset firstEffect
        // and lastEffect since they're on every node, not just the effectful
        // ones. So we have to clean everything as we reuse nodes anyway.
        nextEffect.nextEffect = null;
        // Ensure that we reset the effectTag here so that we can rely on effect
        // tags to reason about the current life-cycle.
        nextEffect = next;
    }
}

function commitLifeCycles(finishedRoot, current, finishedWork, currentTime, committedExpirationTime) {
    switch (finishedWork.tag) {
        case ClassComponent:
            {
                var _instance2 = finishedWork.stateNode;
                if (finishedWork.effectTag & Update) {
                    if (current === null) {
                        startPhaseTimer(finishedWork, 'componentDidMount');
                        _instance2.props = finishedWork.memoizedProps;
                        _instance2.state = finishedWork.memoizedState;
                        // componentDidMount 钩子
                        _instance2.componentDidMount();
                        stopPhaseTimer();
                    } else {
                        var prevProps = current.memoizedProps;
                        var prevState = current.memoizedState;
                        startPhaseTimer(finishedWork, 'componentDidUpdate');
                        _instance2.props = finishedWork.memoizedProps;
                        _instance2.state = finishedWork.memoizedState;

                        // componentDidUpdate 钩子
                        _instance2.componentDidUpdate(prevProps, prevState, _instance2.__reactInternalSnapshotBeforeUpdate);
                        stopPhaseTimer();
                    }
                }
                var updateQueue = finishedWork.updateQueue;
                if (updateQueue !== null) {
                    // 依次调用updateQueue的回调函数，this指向组件实例
                    commitCallbacks(updateQueue, _instance2);
                }
                return;
            }
        case HostRoot:
            {
                var _updateQueue = finishedWork.updateQueue;
                if (_updateQueue !== null) {
                    var _instance3 = null;
                    if (finishedWork.child !== null) {
                        switch (finishedWork.child.tag) {
                            case HostComponent:
                                _instance3 = getPublicInstance(finishedWork.child.stateNode);
                                break;
                            case ClassComponent:
                                _instance3 = finishedWork.child.stateNode;
                                break;
                        }
                    }
                    // 调用hostRoot回调函数，即reactDOM.render中的回调函数，并将this指向根元素 (App组件实例，或 根级的 DOM)
                    commitCallbacks(_updateQueue, _instance3);
                }
                return;
            }
        case HostComponent:
            {
                var _instance4 = finishedWork.stateNode;

                // Renderers may schedule work to be done after host components are mounted
                // (eg DOM renderer may schedule auto-focus for inputs and form controls).
                // These effects should only be committed when components are first mounted,
                // aka when there is no current/alternate.
                if (current === null && finishedWork.effectTag & Update) {
                    var type = finishedWork.type;
                    var props = finishedWork.memoizedProps;
                    // input 元素的自动聚焦等属性，需在插入dom完成之后执行
                    commitMount(_instance4, type, props, finishedWork);
                }

                return;
            }
        case HostText:
            {
                // We have no life-cycles associated with text.
                return;
            }
        case HostPortal:
            {
                // We have no life-cycles associated with portals.
                return;
            }
        default:
            {
                invariant(false, 'This unit of work tag should not have side-effects. This error is likely caused by a bug in React. Please file an issue.');
            }
    }
}

function scheduleCallbackWithExpiration(expirationTime) {
    if (callbackExpirationTime !== NoWork) {
        // A callback is already scheduled. Check its expiration time (timeout).
        if (expirationTime > callbackExpirationTime) {
            // 已经超过的callback的过期时间，说明callback已经调度过了
            // Existing callback has sufficient timeout. Exit.
            return;
        } else {
            // Existing callback has insufficient timeout. Cancel and schedule a
            // new one.

            // 回调还没有超时，将当前任务推后执行
            // cancelIdleCallback 先取消空闲回调
            cancelDeferredCallback(callbackID);
        }
        // The request callback timer is already running. Don't start a new one.
    } else {
        // callbackExpirationTime 为空并且还有剩余任务，说明是异步任务,处理如下
        // isWaitingForCallback = true;beginMark('(Waiting for async callback...)');

        startRequestCallbackTimer();
    }

    // Compute a timeout for the given expiration time.
    var currentMs = now() - originalStartTimeMs;
    var expirationMs = expirationTimeToMs(expirationTime);
    var timeout = expirationMs - currentMs;

    callbackExpirationTime = expirationTime;

    // requestIdleCallback 设置新的空闲时间同步任务回调
    callbackID = scheduleDeferredCallback(performAsyncWork, { timeout: timeout });
}

// 结束渲染
function finishRendering() {
    nestedUpdateCount = 0;

    // 如果存在complete批处理，执行
    if (completedBatches !== null) {
        var batches = completedBatches;
        completedBatches = null;
        for (var i = 0; i < batches.length; i++) {
            var batch = batches[i];
            try {
                batch._onComplete();
            } catch (error) {
                if (!hasUnhandledError) {
                    hasUnhandledError = true;
                    unhandledError = error;
                }
            }
        }
    }

    if (hasUnhandledError) {
        var error = unhandledError;
        unhandledError = null;
        hasUnhandledError = false;
        throw error;
    }
}