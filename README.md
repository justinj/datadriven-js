This library is a port of the
[datadriven](https://github.com/cockroachdb/datadriven) library for Go,
originally written by Andy Kimball.

## Usage

```javascript
const { run, walk } = require('datadriven.js');

walk("testdata", (fname) => {
  run(fname, ({ directive, input }) => {
    return input + "\n" + input + "\n";
  });
});
```
