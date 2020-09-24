import "./styles.css";
import { render, createElement } from "./utils";

const React = { createElement };
// React.createElement("h1", null, "hello");
const element = <h1>hello</h1>;
const container = document.getElementById("root");

render(element, container);
