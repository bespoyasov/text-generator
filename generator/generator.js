import { tokenize, textify } from "./tokenizer.js";

const range = (count) => Array.from(Array(count).keys());
const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pickRandom = (list) => list[random(0, list.length - 1)];

/**
 * When parsing the source text, is it possible
 * to find reserved words e.g. “constructor”, “function” etc.
 * To prevent them from accessing the real properties on an object
 * we naively escape `tokens`.
 */
const escapeString = (token) => `_+${token}`;
const fromTokens = (tokens) => escapeString(tokens.join(""));

/**
 * We need to slice the given source text into a set of `samples`.
 * Each sample contains 2 or more `tokens` — words, spaces, or punctuation marks.
 * The bigger `sampleSize` is, the more tokens are used to generate the next.
 */
function sliceCorpus(corpus, sampleSize) {
  return corpus
    .map((_, index) => corpus.slice(index, index + sampleSize))
    .filter((group) => group.length === sampleSize);
}

/**
 * Transition matrix is an object with `samples` as keys
 * and lists of their following tokens as values.
 * This object will allow to randomly select one
 * of the following tokens to “generate” the next word.
 *
 * We don't use Map() here, since we would need to stringify keys anyway.
 * Map uses referential equality for keys comparison
 * and different array instances would be considered as different keys.
 */
function collectTransitions(samples) {
  return samples.reduce((transitions, sample) => {
    const lastIndex = sample.length - 1;
    const lastToken = sample[lastIndex];
    const restTokens = sample.slice(0, lastIndex);

    const state = fromTokens(restTokens);
    const next = lastToken;

    transitions[state] = transitions[state] ?? [];
    transitions[state].push(next);
    return transitions;
  }, {});
}

/**
 * Initially, the chain is the tokenized `startText` if given,
 * or a random sample—the key from the transition matrix.
 */
function createChain(startText, transitions) {
  const head = startText ?? pickRandom(Object.keys(transitions));
  return tokenize(head);
}

/**
 * When generating a next word,
 * we take the (`sampleSize`) number of last `tokens` from the chain.
 * These tokens consist a key for the transition matrix,
 * by which we get a list of possible next words,
 * and randomly select one from them.
 */
function predictNext(chain, transitions, sampleSize) {
  const lastState = fromTokens(chain.slice(-(sampleSize - 1)));
  const nextWords = transitions[lastState] ?? [];
  return pickRandom(nextWords);
}

/**
 * Each time the generator is asked for a new word,
 * it “predicts” the next `token` for the `chain` and yields it.
 * If there are no following tokens, it removes the last token from the chain
 * so the chain contains only sequences that can produce new words.
 */
function* generateChain(startText, transitions, sampleSize) {
  const chain = createChain(startText, transitions);

  while (true) {
    const state = predictNext(chain, transitions, sampleSize);
    yield state;

    if (state) chain.push(state);
    else chain.pop();
  }
}

export function generate({
  source,
  start = null,
  wordsCount = 200,
  sampleSize = 3,
} = {}) {
  if (!source) throw new Error("The source text cannot be empty.");
  if (sampleSize < 2) throw new Error("Sample size must not be less than 2.");

  const corpus = tokenize(String(source));
  const samples = sliceCorpus(corpus, sampleSize);
  const transitions = collectTransitions(samples);

  const generator = generateChain(start, transitions, sampleSize);
  const chain = range(wordsCount).map((_) => generator.next().value);
  return textify(chain);
}
