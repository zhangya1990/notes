
// fiber tag
export type TypeOfWork = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const IndeterminateComponent = 0; // 尚不知是类组件还是函数式组件
export const FunctionalComponent = 1; // 函数式组件
export const ClassComponent = 2; // Class类组件
export const HostRoot = 3; // 组件树根组件，可以嵌套
export const HostPortal = 4; // 子树. Could be an entry point to a different renderer.
export const HostComponent = 5; // 标准组件，如地div， span等
export const HostText = 6; // 文本
export const CallComponent = 7; // 组件调用
export const CallHandlerPhase = 8; // 调用组件方法
export const ReturnComponent = 9; // placeholder（占位符）
export const Fragment = 10; // 片段


// fiber root 对象
export type FiberRoot = {
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



// 一个Fiber对象作用于一个组件
export type Fiber = {
    // 标记fiber类型tag.
    tag: TypeOfWork,
    // fiber对应的function/class/module类型组件名.
    type: any,

    // fiber所在组件树的根组件FiberRoot对象或者组件实例
    stateNode: any,
    // 处理完当前fiber后返回的fiber，
    // 返回当前fiber所在fiber树的父级fiber实例
    return: Fiber | null,
    // fiber树结构相关链接
    child: Fiber | null,
    sibling: Fiber | null,
    index: number,

    // 当前处理过程中的组件props对象
    pendingProps: any,
    // 缓存的之前组件props对象
    memoizedProps: any, // The props used to create the output.
    // The state used to create the output
    memoizedState: any,

    // 组件状态更新及对应回调函数的存储队列
    updateQueue: UpdateQueue<any> | null,


    // 描述当前fiber实例及其子fiber树的数位，
    // 如，AsyncUpdates特殊字表示默认以异步形式处理子树，
    // 一个fiber实例创建时，此属性继承自父级fiber，在创建时也可以修改值，
    // 但随后将不可修改。
    mode: TypeOfMode,

    // Effect
    // 副作用的类型
    effectTag: TypeOfSideEffect,

    // Singly linked list fast path to the next fiber with side-effects.
    // 链表中包含副作用的下一个fiber
    nextEffect: Fiber | null,

    // The first and last fiber with side-effect within this subtree. This allows
    // us to reuse a slice of the linked list when we reuse the work done within
    // this fiber.

    // 当前fiber子树中包含副作用的第一个和最后一个fiber,当我们重启当前的work时，可以重用链表的一部分
    firstEffect: Fiber | null,
    lastEffect: Fiber | null,


    // 更新任务的最晚执行时间,这也用于快速判断子树是否没有挂起的更改
    expirationTime: ExpirationTime,

    // 可以理解为一个fiber版本池，用于交替记录组件更新（切分任务后变成多阶段更新）过程中fiber的更新，因为在组件更新的各阶段，更新前及更新过程中fiber状态并不一致，在需要恢复时（如，发生冲突），即可使用另一者直接回退至上一版本fiber。

    // 使用alternate属性双向连接一个当前fiber和其work-in-progress，当前fiber实例的alternate属性指向其work-in-progress，work-in-progress的alternate属性指向当前稳定fiber；
    // 当前fiber的替换版本是其work-in-progress，work-in-progress的交替版本是当前fiber；
    // 当work-in-progress更新一次后，将同步至当前fiber，然后继续处理，同步直至任务完成；
    // work-in-progress指向处理过程中的fiber，而当前fiber总是维护处理完成的最新版本的fiber。
    alternate: Fiber | null,
};
