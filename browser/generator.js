import { generate } from "../generator/index.js";

self.onmessage = ({ data: settings }) => {
  const result = generate(settings);
  self.postMessage({ result });
};
