var ReactFiberStack = function () {
    var valueStack = [];
  
    var fiberStack = void 0;
  
    {
      fiberStack = [];
    }
  
    var index = -1;
  
    // 创建一个默认值标记，标记的current属性指向标记的值
    function createCursor(defaultValue) {
      return {
        current: defaultValue
      };
    }
  
    function isEmpty() {
      return index === -1;
    }
  
    // 删除一个指定的fiber，将cursor的值恢复为valueStack中存储的值，并从valueStack，fiberStack中移除对应的值
    function pop(cursor, fiber) {
      if (index < 0) {
        {
          warning(false, 'Unexpected pop.');
        }
        return;
      }
  
      {
        if (fiber !== fiberStack[index]) {
          warning(false, 'Unexpected Fiber popped.');
        }
      }
  
      cursor.current = valueStack[index];
  
      valueStack[index] = null;
  
      {
        fiberStack[index] = null;
      }
  
      index--;
    }
  
    // 将cursor的原始值存入valueStack，并将当前值修改为value，将fiber存入fiberStack
    function push(cursor, value, fiber) {
      index++;
  
      valueStack[index] = cursor.current;
  
      {
        fiberStack[index] = fiber;
      }
  
      cursor.current = value;
    }
  
    //检查stack是否为空
    function checkThatStackIsEmpty() {
      {
        if (index !== -1) {
          warning(false, 'Expected an empty stack. Something was not reset properly.');
        }
      }
    }
  
    // 重置stack
    function resetStackAfterFatalErrorInDev() {
      {
        index = -1;
        valueStack.length = 0;
        fiberStack.length = 0;
      }
    }
  
    return {
      createCursor: createCursor,
      isEmpty: isEmpty,
      pop: pop,
      push: push,
      checkThatStackIsEmpty: checkThatStackIsEmpty,
      resetStackAfterFatalErrorInDev: resetStackAfterFatalErrorInDev
    };
  };