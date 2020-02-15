let fs = require('fs');

fs.readFile('./node_modules/@protobufjs/inquire/index.js', 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  let find = 'eval("quire".replace(/^/,"re"))';
  let replace = 'require';
  let result = data.replace(find, replace);

  fs.writeFile('./node_modules/@protobufjs/inquire/index.js', result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});