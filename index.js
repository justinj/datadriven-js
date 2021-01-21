const fs = require("fs");
const assert = require("assert");

module.exports = {};

const lines = function* (tf) {
  let start = 0;
  let i = 0;
  while (i < tf.length) {
    while (i < tf.length && tf[i] !== "\n") {
      i++;
    }
    yield tf.slice(start, i);
    i++;
    start = i;
  }
};

const BLANK = "blank";
const TEST_CASE = "test_case";

const walk = function (dir, f) {
  for (let file of fs.readdirSync(dir)) {
    f(dir + "/" + file);
  }
};

const run = function (fname, f) {
  let contents = fs.readFileSync(fname).toString();
  let parsed = module.exports.parse(contents);

  let rewrite = process.argv.indexOf("--rewrite") > -1;

  if (rewrite) {
    // TODO: is there a stringbuilder?
    let buf = "";
    let sep = "";
    for (let cmd of parsed) {
      switch (cmd.type) {
        case "test_case":
          let result = f({
            directive: module.exports.parseDirective(cmd.directive),
            input: cmd.input.trim(),
          });
          let multiline = result.includes("\n\n");
          buf += sep;
          buf += cmd.directive + "\n";
          buf += cmd.input;
          buf += "----\n";
          if (multiline) buf += "----\n";
          buf += result;
          if (!result.endsWith("\n")) {
            throw new Error("results must end with a newline");
          }
          sep = "";
          if (multiline) {
            buf += "----\n----";
            sep = "\n";
          }
          buf += "\n";
          break;
        case "blank":
          sep = "";
          buf += cmd.value + "\n";
          break;
      }
    }
    fs.writeFileSync(fname, buf);
  } else {
    for (let cmd of parsed) {
      switch (cmd.type) {
        case "test_case":
          let result = f({
            directive: module.exports.parseDirective(cmd.directive),
            input: cmd.input.trim(),
          });
          assert.deepStrictEqual(result, cmd.output);
      }
    }
  }
};

const parse = function* (tf) {
  let value;
  let done = false;
  let ls = lines(tf);
  ({ value, done } = ls.next());
  while (!done) {
    if (value.match(/^\s*\w/)) {
      let directive = value;
      let input = "";
      ({ value, done } = ls.next());
      while (value !== "----") {
        input += value + "\n";
        ({ value, done } = ls.next());
        if (done) {
          throw new Error("expected ----");
        }
      }
      ({ value, done } = ls.next());
      let blankMode = false;
      if (value === "----") {
        blankMode = true;
        ({ value, done } = ls.next());
      }
      let output = "";
      while (!done && (blankMode || value.trim() !== "")) {
        output += value + "\n";
        ({ value, done } = ls.next());
        if (blankMode && value === "----") {
          ({ value, done } = ls.next());
          if (value === "----") {
            break;
          }
        }
      }
      yield {
        type: TEST_CASE,
        directive,
        input,
        output,
      };
    } else {
      yield {
        type: BLANK,
        value,
      };
    }
    ({ value, done } = ls.next());
  }
};

const parseDirective = function (dir) {
  let i = 0;
  let munch = () => {
    while (i < dir.length && dir[i].match(/\s/)) {
      i++;
    }
  };
  let nextWord = () => {
    let start = i;
    while (i < dir.length && dir[i].match(/\w/)) {
      i++;
    }
    let w = dir.slice(start, i);
    munch();
    return w;
  };
  munch();
  let command = nextWord();
  let args = [];
  munch();
  while (i < dir.length) {
    if (dir[i].match(/\w/)) {
      let flag = nextWord();
      let vars = [];
      munch();
      if (i < dir.length && dir[i] === "=") {
        i++;
        munch();
        if (i < dir.length && dir[i] === "(") {
          i++;
          munch();
          vars.push(nextWord());
          while (i < dir.length && dir[i] === ",") {
            i++;
            munch();
            vars.push(nextWord());
          }
          if (i >= dir.length || dir[i] !== ")") {
            throw new Error("unclosed paren");
          }
          i++;
          munch();
        } else {
          if (i >= dir.length || !dir[i].match(/\w/)) {
            throw new Error("invalid argument");
          }
          vars.push(nextWord());
        }
      }
      args.push({ flag, vars });
    } else {
      throw new Error(`unexpected in directive line: ${dir[i]}`);
    }
    munch();
  }
  return {
    command,
    args,
  };
};

module.exports = {
  walk,
  run,
  parse,
  parseDirective,
};
