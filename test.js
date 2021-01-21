const assert = require("assert");
const { parse, parseDirective, run, walk } = require("./index");

describe("test file parser", () => {
  it("walks", () => {
    walk("testdata", (fname) => {
      run(fname, ({ directive, input }) => {
        return input + "\n" + input + "\n";
      });
    });
  });

  it("runs", () => {
    run("testdata/t", ({ directive, input }) => {
      return input + "\n" + input + "\n";
    });
  });

  it("parses a blank line mode test", () => {
    assert.deepStrictEqual(
      [
        ...parse(
          "foo\n----\n----\nline1\n\nline2\nline3\n----\n----\n\n# a comment\n"
        ),
      ],
      [
        {
          directive: "foo",
          input: "",
          output: "line1\n\nline2\nline3\n",
          type: "test_case",
        },
        {
          type: "blank",
          value: "",
        },
        {
          type: "blank",
          value: "# a comment",
        },
      ]
    );
  });

  it("parses a simple test file", () => {
    assert.deepStrictEqual(
      [...parse("foo\n----\nbar\n")],
      [
        {
          directive: "foo",
          input: "",
          output: "bar\n",
          type: "test_case",
        },
      ]
    );

    assert.deepStrictEqual(
      [...parse("# a comment\nfoo\ninput\n----\nbar\n")],
      [
        {
          type: "blank",
          value: "# a comment",
        },
        {
          directive: "foo",
          input: "input\n",
          output: "bar\n",
          type: "test_case",
        },
      ]
    );

    assert.deepStrictEqual(
      [
        ...parse(
          "# a comment\nfoo\ninput\n----\nbar\n\n# a second comment\na second testcase\ninput2\n----\nline1\nline2"
        ),
      ],
      [
        {
          type: "blank",
          value: "# a comment",
        },
        {
          directive: "foo",
          input: "input\n",
          output: "bar\n",
          type: "test_case",
        },
        {
          type: "blank",
          value: "# a second comment",
        },
        {
          directive: "a second testcase",
          input: "input2\n",
          output: "line1\nline2\n",
          type: "test_case",
        },
      ]
    );
  });
});

describe("directive parser", () => {
  it("parses a directive line", () => {
    assert.deepStrictEqual(parseDirective("foo"), {
      command: "foo",
      args: [],
    });
  });

  it("parses a directive line with flags", () => {
    assert.deepStrictEqual(parseDirective("foo bar baz"), {
      command: "foo",
      args: [
        { flag: "bar", vars: [] },
        { flag: "baz", vars: [] },
      ],
    });
  });

  it("parses a directive line with flags and arguments", () => {
    assert.deepStrictEqual(parseDirective("foo bar=baz"), {
      command: "foo",
      args: [{ flag: "bar", vars: ["baz"] }],
    });
  });

  it("parses a directive line with flags and multiple arguments", () => {
    assert.deepStrictEqual(parseDirective("foo bar=(baz, goo)"), {
      command: "foo",
      args: [{ flag: "bar", vars: ["baz", "goo"] }],
    });
  });
});
