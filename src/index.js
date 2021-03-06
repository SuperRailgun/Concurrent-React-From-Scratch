import "./styles.css";
import { createElement, performUnitOfWork, commitWork } from "./utils";

let wipRoot,
  nextUnitOfWork = null;

const React = { createElement };
function App() {
  return (
    <div>
      <h1>hello</h1>
      <ul>
        <li>foo</li>
        <li>bar</li>
      </ul>
    </div>
  );
}
const container = document.getElementById("root");

creatRoot(container).render(<App />);

function creatRoot(_container) {
  return {
    render(el) {
      wipRoot = {
        dom: _container,
        props: {
          children: [el]
        }
      };

      nextUnitOfWork = wipRoot;

      while (nextUnitOfWork) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      }

      commitWork(wipRoot.child);
    }
  };
}
