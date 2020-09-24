import "./styles.css";
import { render, createElement } from "./utils";

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

render(<App />, container);
