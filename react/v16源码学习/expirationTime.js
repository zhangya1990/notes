// 过期时间说明

export type ExpirationTime = number;

export const NoWork = 0; // 没有任务等待处理
export const Sync = 1; // 同步模式，立即处理任务
export const Never = 2147483647; // Max int32: Math.pow(2, 31) - 1
const UNIT_SIZE = 10; // 过期时间单元 10（ms）
const MAGIC_NUMBER_OFFSET = 2; // 到期时间偏移量

// 以ExpirationTime特定单位（1单位=10ms）表示的到期执行时间
// 1 unit of expiration time represents 10ms.
export function msToExpirationTime (ms) {
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
export function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs,) {
    
  return ceiling(
    currentTime + expirationInMs / UNIT_SIZE,
    bucketSizeMs / UNIT_SIZE
  );
}