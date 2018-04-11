// 调度任务
// expirationTime为期望的任务到期时间
function scheduleWork(fiber, expirationTime: ExpirationTime) {
    return scheduleWorkImpl(fiber, expirationTime, false);
}

function scheduleWorkImpl(
    fiber, expirationTime
) {
    let node = fiber;
    while (node !== null) {
        // 向上遍历至根组件fiber实例，并依次更新expirationTime到期时间
        if (
            node.expirationTime === NoWork ||
            node.expirationTime > expirationTime
        ) {
            // 若fiber实例到期时间大于期望的任务到期时间，则更新fiber到期时间
            node.expirationTime = expirationTime;
        }
        // 同时更新alternate fiber的到期时间
        if (node.alternate !== null) {
            if (
                node.alternate.expirationTime === NoWork ||
                node.alternate.expirationTime > expirationTime
            ) {
                // 若alternate fiber到期时间大于期望的任务到期时间，则更新fiber到期时间
                node.alternate.expirationTime = expirationTime;
            }
        }
        // node.return为空，说明到达组件树顶部
        if (node.return === null) {
            if (node.tag === HostRoot) {
                // 确保是组件树根组件并获取FiberRoot实例
                const root = node.stateNode;
                // 请求处理任务
                requestWork(root, expirationTime);
            } else {
                return;
            }
        }
        // 获取父级组件fiber实例
        node = node.return;
    }
}

function scheduleWorkImpl(fiber, expirationTime, isErrorRecovery) {

    // 记录本次调度更新情况
    recordScheduleUpdate();

    // 警告，暂时忽略
    {
        if (!isErrorRecovery && fiber.tag === ClassComponent) {
            var instance = fiber.stateNode;
            warnAboutInvalidUpdates(instance);
        }
    }

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


                // 暂时没有理解，日后再说
                if (!isWorking && nextRenderExpirationTime !== NoWork && expirationTime < nextRenderExpirationTime) {
                    // This is an interruption. (Used for performance tracking.)
                    interruptedBy = fiber;
                    resetStack();
                }

                    
                
                // 如果当前正在渲染阶段，没有必要再次调度更新，或者当前root与正在渲染的root不同
                if (
                    // If we're in the render phase, we don't need to schedule this root
                    // for an update, because we'll do it before we exit...

                    !isWorking || isCommitting ||
                    // ...unless this is a different root than the one we're rendering.
                    nextRoot !== root) {
                    // Add this root to the root schedule.

                    // 请求处理任务
                    requestWork(root, expirationTime);
                }
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
      // 如果当前正在渲染，停止本次任务请求
      return;
    }

    if (isBatchingUpdates) {
      // Flush work at the end of the batch.
      if (isUnbatchingUpdates) {
        // ...unless we're inside unbatchedUpdates, in which case we should
        // flush it now.
        nextFlushedRoot = root;
        nextFlushedExpirationTime = Sync;
        performWorkOnRoot(root, Sync, false);
      }
      return;
    }

    // TODO: Get rid of Sync and use current time?
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
          //调度器首次执行，firstScheduledRoot，lastScheduledRoot赋值，root.nextScheduledRoot赋值，表明当前root已被调度过
        firstScheduledRoot = lastScheduledRoot = root;
        root.nextScheduledRoot = root;
      } else {
          //调度器已经调度过其他root，调度当前root，首先给将当前root添加到上次调度的root顺序后面，root.nextScheduledRoot 赋值为 firstScheduledRoot
        lastScheduledRoot.nextScheduledRoot = root;
        lastScheduledRoot = root;
        lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
      }
    } else {
      // This root is already scheduled, but its priority may have increased.
      // 当前root对象已经被调度过，但是优先级有可能需要增加
      var remainingExpirationTime = root.remainingExpirationTime;
      if (remainingExpirationTime === NoWork || expirationTime < remainingExpirationTime) {
        // Update the priority.
        // 任务剩余到期时间大于期望的任务到期时间，则需要更新提高优先级,修改任务到期时间
        root.remainingExpirationTime = expirationTime;
      }
    }
  }