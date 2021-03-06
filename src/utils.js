// utils.js
/**
 *
 * @param {any} element 创建的 ele 对象
 * @param {Document} container dom 对象
 */
export function render(element, container) {
  // eg. <App /> React.createElement(App, null);
  if (typeof element.type === "function") element = element.type();
  // 分别处理 文本和普通节点
  const dom =
    element.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(element.type);
  // filter 帮助函数判断是否是 children
  const isProperty = (key) => key !== "children";
  Object.keys(element.props)
    .filter(isProperty)
    // 如果不是注入到 dom 上
    .forEach((name) => {
      dom[name] = element.props[name];
    });

  // https://github.com/tc39/proposal-optional-chaining
  // eslint-disable-next-line
  element.props.children?.forEach((child) => render(child, dom));
  // 迭代!                               👆

  // 现在 render 是出来一个就加入到（commit）到 dom 一个
  // 并不符合 react 的 rander then commit
  container.appendChild(dom);
}

// JSX
/**
 * 创建 文本 对象
 * @param {string} text 文字
 */
export function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  };
}
/**
 * 创建 ele 对象
 * @param {string} type div/a  function
 * @param {any} props any
 * @param  {...any} children
 */
export function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) =>
        // 磨平差异，都是对象
        typeof child === "object" ? child : createTextElement(child)
      )
    }
  };
}

// RENDER-AND-COMMIT
const noop = () => {};
export function performUnitOfWork(fiber, resetWipFiber = noop) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    // it is either a function component... (so call it)
    resetWipFiber(fiber);
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children.flat());
  } else {
    // or a host component... (so createDom)
    if (!fiber.dom) fiber.dom = createDom(fiber);
    reconcileChildren(fiber, fiber.props.children.flat());
  }
  if (fiber.child) return fiber.child;
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}
function reconcileChildren(wipFiber, elements) {
  let index = 0;
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
  let prevSibling = null;
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber = null;
    const sameType = oldFiber && element && element.type == oldFiber.type;
    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE"
      };
    }
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        alternate: null,
        effectTag: "PLACEMENT"
      };
    }
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      // deletions.push(oldFiber)
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      wipFiber.child = newFiber;
    } else if (element) {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index++;
  }
}

// COMMIT
export function commitWork(fiber) {
  if (!fiber) return;
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}
function createDom(fiber) {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}
function updateDom(dom, prevProps, nextProps) {
  const isGone = (prev, next) => (key) => !(key in next);
  const isNew = (prev, next) => (key) => prev[key] !== next[key];
  const isEvent = (key) => key.startsWith("on");
  const isProperty = (key) => key !== "children" && !isEvent(key);
  //Remove old or changed event listeners
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps)(key))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
  // Remove old properties
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = "";
    });
  // Set new or changed properties
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      dom[name] = nextProps[name];
    });
  // Add event listeners
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((name) => {
      const eventType = name.toLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}
