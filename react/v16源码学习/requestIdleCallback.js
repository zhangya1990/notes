
// This is a built-in polyfill for requestIdleCallback. It works by scheduling
// a requestAnimationFrame, storing the time for the start of the frame, then
// scheduling a postMessage which gets scheduled after paint. Within the
// postMessage handler do as much work as possible until time + frame rate.
// By separating the idle call into a separate event tick we ensure that
// layout, paint and other browser work is counted against the available time.
// The frame rate is dynamically adjusted.

// 提供一个内置的 requestIdleCallback polyfill,通过调度 requestAnimationFrame 来工作，存储当前帧开始的时间，然后在当前帧绘制完成之后通过postMessge事件处理尽可能多的优先级较低的工作，通过计算剩余时间，将idle call(低优先级工作) 分离成小的片段多次执行，以保证 布局、绘制以及其他浏览器的工作能够流畅执行。通过一个启发式的算法动态调整 fps

// 浏览器原生 requestIdleCallback 见 ../html/requestIdleCallback.html 及  requestAnimationCallback.html 相关说明

import type {Deadline} from 'react-reconciler';

import {alwaysUseRequestIdleCallbackPolyfill} from 'shared/ReactFeatureFlags';
import ExecutionEnvironment from 'fbjs/lib/ExecutionEnvironment';


const hasNativePerformanceNow =
  typeof performance === 'object' && typeof performance.now === 'function';

  //获取当前时间
let now;
if (hasNativePerformanceNow) {
  now = function() {
    return performance.now();
  };
} else {
  now = function() {
    return Date.now();
  };
}

// TODO: There's no way to cancel, because Fiber doesn't atm.
let rIC: (
  callback: (deadline: Deadline, options?: {timeout: number}) => void,
) => number;
let cIC: (callbackID: number) => void;

//非dom环境忽略 - -
if (!ExecutionEnvironment.canUseDOM) {
  rIC = function(
    frameCallback: (deadline: Deadline, options?: {timeout: number}) => void,
  ): number {
    return setTimeout(() => {
      frameCallback({
        timeRemaining() {
          return Infinity;
        },
        didTimeout: false,
      });
    });
  };
  cIC = function(timeoutID: number) {
    clearTimeout(timeoutID);
  };
} else if (
  alwaysUseRequestIdleCallbackPolyfill ||
  typeof requestIdleCallback !== 'function' ||
  typeof cancelIdleCallback !== 'function'
) {
  // Polyfill requestIdleCallback and cancelIdleCallback

    // 提供内置的polyfill

    // RIC callback
  let scheduledRICCallback = null;

    // 是否正在执行 RIC callback (requestIdleCallback 回调函数)
  let isIdleScheduled = false;

    // RIC callback 超时时间
  let timeoutTime = -1;

    // 是否正在执行 rAC callback (requestAnimationCallback回调函数)
  let isAnimationFrameScheduled = false;

    // 帧临界时间点
  let frameDeadline = 0;


  // We start out assuming that we run at 30fps but then the heuristic tracking
  // will adjust this value to a faster fps if we get more frequent animation
  // frames.

    // 初始化为 30 fps ，如果有更加频繁的动画，启发式的调整
    // 上一帧的时间
    // 当前帧的时间
  let previousFrameTime = 33;
  let activeFrameTime = 33;

    // deadLine 对象，作为参数传入 rIC callback
  let frameDeadlineObject;
  if (hasNativePerformanceNow) {
    frameDeadlineObject = {
      didTimeout: false,
      timeRemaining() {
        // We assume that if we have a performance timer that the rAF callback
        // gets a performance timer value. Not sure if this is always true.
        const remaining = frameDeadline - performance.now();
        return remaining > 0 ? remaining : 0;
      },
    };
  } else {
    frameDeadlineObject = {
      didTimeout: false,
      timeRemaining() {
        // Fallback to Date.now()
        const remaining = frameDeadline - Date.now();
        return remaining > 0 ? remaining : 0;
      },
    };
  }

  // We use the postMessage trick to defer idle work until after the repaint.
  const messageKey =
    '__reactIdleCallback$' +
    Math.random()
      .toString(36)
      .slice(2);


 // Assumes that we have addEventListener in this environment. Might need
  // something better for old IE.
  window.addEventListener('message', idleTick, false);


      // 空闲期回调 postMessage 事件回调，当帧回调执行完成时如果还有剩余时间执行
  const idleTick = function(event) {
    if (event.source !== window || event.data !== messageKey) {
      return;
    }

    // 空闲回调完成后 将标识符置为false
    isIdleScheduled = false;

    const currentTime = now();
    if (frameDeadline - currentTime <= 0) {
        // 当前帧已经没有剩余时间

      // There's no time left in this idle period. Check if the callback has
      // a timeout and whether it's been exceeded.
      if (timeoutTime !== -1 && timeoutTime <= currentTime) {
        // Exceeded the timeout. Invoke the callback even though there's no
        // time left.

        // 设置了超时时间，并且已经超时，将 didTimeout 置为 true ，虽然已经没有剩余时间，还是要在调用栈尾部强制调用 rIC callback
        frameDeadlineObject.didTimeout = true;
      } else {
        // No timeout.

        // 设置了超时时间，并且没有超时, 由于已经没有剩余时间，将 rIC callback 延迟，直接调用下一次 帧回调。
        if (!isAnimationFrameScheduled) {
          // Schedule another animation callback so we retry later.

          // 将 isAnimationFrameScheduled 置为 true
          isAnimationFrameScheduled = true;
          requestAnimationFrame(animationTick);
        }
        // Exit without invoking the callback.
        return;
      }
    } else {
      // There's still time left in this idle period.

      // 当前帧结束时间并没有超过 callback超时时间,并且当前帧仍有剩余时间,didTimeout 为 false，并且调用 rIC callback,重置timeoutTime 

      frameDeadlineObject.didTimeout = false;
    }

    timeoutTime = -1;
    const callback = scheduledRICCallback;
    scheduledRICCallback = null;
    if (callback !== null) {
      callback(frameDeadlineObject);
    }
  };
 

  // 帧回调

  const animationTick = function(rafTime) {

        // 帧回调执行完成之后将标识符置为false
    isAnimationFrameScheduled = false;

        // rafTime 当前时间  freamDeadline 上一预估帧临界时间  activeFrameTime 上次计算的前帧的时间 初始为 33
        // 计算当前帧的时间 nextFrameTime,最后经过对比得到实际当前帧的时间 activeFrameTime
    let nextFrameTime = rafTime - frameDeadline + activeFrameTime;

    if (
      nextFrameTime < activeFrameTime &&
      previousFrameTime < activeFrameTime
    ) {
      if (nextFrameTime < 8) {
        // Defensive coding. We don't support higher frame rates than 120hz.
        // If we get lower than that, it is probably a bug.

        // 不支持超过120hz
        nextFrameTime = 8;
      }
      // If one frame goes long, then the next one can be short to catch up.
      // If two frames are short in a row, then that's an indication that we
      // actually have a higher frame rate than what we're currently optimizing.
      // We adjust our heuristic dynamically accordingly. For example, if we're
      // running on 120hz display or 90hz VR display.
      // Take the max of the two in case one of them was an anomaly due to
      // missed frame deadlines.
      activeFrameTime =
        nextFrameTime < previousFrameTime ? previousFrameTime : nextFrameTime;
    } else {
        // 如果previousFrameTime 大于 activeFrameTime，将previousFrameTime置为本次计算的值

      previousFrameTime = nextFrameTime;
    }
    frameDeadline = rafTime + activeFrameTime;
    if (!isIdleScheduled) {
        // 调度 空闲回调
      isIdleScheduled = true;
      window.postMessage(messageKey, '*');
    }
  };

  rIC = function(
    callback: (deadline: Deadline) => void,
    options?: {timeout: number},
  ): number {
    // This assumes that we only schedule one callback at a time because that's
    // how Fiber uses it.
    scheduledRICCallback = callback;
    if (options != null && typeof options.timeout === 'number') {
      timeoutTime = now() + options.timeout;
    }
    if (!isAnimationFrameScheduled) {
      // If rAF didn't already schedule one, we need to schedule a frame.
      // TODO: If this rAF doesn't materialize because the browser throttles, we
      // might want to still have setTimeout trigger rIC as a backup to ensure
      // that we keep performing work.
      isAnimationFrameScheduled = true;
      requestAnimationFrame(animationTick);
    }
    return 0;
  };

  cIC = function() {
    scheduledRICCallback = null;
    isIdleScheduled = false;
    timeoutTime = -1;
  };
} else {
  rIC = window.requestIdleCallback;
  cIC = window.cancelIdleCallback;
}

export {now, rIC, cIC};