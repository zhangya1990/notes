// 过期时间说明

export type ExpirationTime = number;

export const NoWork = 0; // 没有任务等待处理
export const Sync = 1; // 同步模式，立即处理任务
export const Never = 2147483647; // Max int32: Math.pow(2, 31) - 1
const UNIT_SIZE = 10; // 过期时间单元 10（ms）
const MAGIC_NUMBER_OFFSET = 2; // 到期时间偏移量

// 以ExpirationTime特定单位（1单位=10ms）表示的到期执行时间
// 1 unit of expiration time represents 10ms.
export function msToExpirationTime(ms) {
    // 总是增加一个偏移量，在ms<10时与Nowork模式进行区别
    return ((ms / UNIT_SIZE) | 0) + MAGIC_NUMBER_OFFSET;
}
// 以毫秒表示的到期执行时间
export function expirationTimeToMs(expirationTime: ExpirationTime) {
    return (expirationTime - MAGIC_NUMBER_OFFSET) * UNIT_SIZE;
}
// 向上取整（整数单位到期执行时间）
// precision范围精度：弥补任务执行时间误差
function ceiling(num, precision) {
    return (((num / precision) | 0) + 1) * precision;
}

// 计算处理误差时间在内的到期时间
/* 
    @ params
    @ currentTime 当前时间 (单位:unit)
    @ expirationInMs 过期时间 (单位:ms)
    @ bucketSizeMs 误差时间 (单位:ms)
*/
export function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs, ) {

    return ceiling(
        currentTime + expirationInMs / UNIT_SIZE,
        bucketSizeMs / UNIT_SIZE
    );
}



//计算某个fiber的到期时间

// 表示下一个要处理的任务的到期时间，默认为NoWork，即当前没有正在等待执行的任务；
// Nowork默认更新策略：异步模式下，异步执行任务；同步模式下同步执行任务
let expirationContext = NoWork;
// 下一次渲染到期时间
let nextRenderExpirationTime = NoWork;
// 异步更新
export const AsyncUpdates = 1;
// 初始时间（ms）.
const startTime = now();
// ExpirationTime单位表示的当前时间（ExpirationTime单位，初始值传入0）
let mostRecentCurrentTime = msToExpirationTime(0);

function computeExpirationForFiber(fiber: Fiber) {
    let expirationTime;
    if (expirationContext !== NoWork) {
        // An explicit expiration context was set;
        // 如果当前存在一个已经设置好的过期时间
        expirationTime = expirationContext;
    } else if (isWorking) {
        // 当前正在任务执行阶段
        if (isCommitting) {
            // Updates that occur during the commit phase should have sync priority
            // by default.
            // 正在提交
            // 过期时间设置为同步任务(最高优先级)
            expirationTime = Sync;
        } else {
            // Updates during the render phase should expire at the same time as
            // the work that is being rendered.
             // 在渲染的同时更新，应该把过期时间设置为下一次渲染的到期时间(当前渲染完成)
            expirationTime = nextRenderExpirationTime;
        }
    } else {
        // No explicit expiration context was set, and we're not currently
        // performing work. Calculate a new expiration time.

        // 没有设置明确的到期时间，并且当前也没有执行任务

        if (fiber.mode & AsyncMode) {
            if (isBatchingInteractiveUpdates) {
                // This is an interactive update

                // 交互式更新
                // 计算交互式更新的过期时间 Should complete within ~500ms. 600ms max.
                const currentTime = recalculateCurrentTime();
                expirationTime = computeInteractiveExpiration(currentTime);
            } else {
                // This is an async update
                // 异步更新
                // 计算异步更新的过期时间 Should complete within ~1000ms. 1200ms max.
                const currentTime = recalculateCurrentTime();
                expirationTime = computeAsyncExpiration(currentTime);
            }
        } else {
            // This is a sync update
            // 同步更新
            expirationTime = Sync;
        }
    }
    if (isBatchingInteractiveUpdates) {
        // This is an interactive update. Keep track of the lowest pending
        // interactive expiration time. This allows us to synchronously flush
        // all interactive updates when needed.
        // 如果是交互式的更新，计算最少等待更新时间，必要时同步更新
        if (
            lowestPendingInteractiveExpirationTime === NoWork ||
            expirationTime > lowestPendingInteractiveExpirationTime
        ) {
            lowestPendingInteractiveExpirationTime = expirationTime;
        }
    }
    return expirationTime;
}


function computeAsyncExpiration(currentTime) {
    // Given the current clock time, returns an expiration time. We use rounding
    // to batch like updates together.
    // Should complete within ~1000ms. 1200ms max.
    var expirationMs = 5000;
    var bucketSizeMs = 250;
    return computeExpirationBucket(currentTime, expirationMs, bucketSizeMs);
  }

  function computeInteractiveExpiration(currentTime) {
    // Should complete within ~500ms. 600ms max.
    var expirationMs = 500;
    var bucketSizeMs = 100;
    return computeExpirationBucket(currentTime, expirationMs, bucketSizeMs);
  }
