const generator = new Worker("./generator.js", { type: "module" });
const form = document.getElementById("form");

function updateOutput(content) {
  const output = document.getElementById("result");
  output.innerText = content;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = new FormData(e.target);
  const reader = new FileReader();

  const wordsCount = Number(data.get("wordsCount"));
  const sampleSize = Number(data.get("sampleSize"));
  const source = data.get("source");

  reader.readAsText(source);
  reader.addEventListener("load", () => {
    updateOutput("Generating...");
    generator.postMessage({
      source: reader.result,
      wordsCount,
      sampleSize,
    });
  });
});

generator.onmessage = ({ data: { result } }) => {
  updateOutput(result);
};
