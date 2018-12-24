var http = require('http');
var fs = require('fs');

http.createServer(function (req, res) {
  res.writeHead(200);
  var url = (req.url == '/') ? '/index.html' : req.url;
  if (~url.indexOf('index')) url = '/examples' + url
  console.log(url)
  fs.readFile(__dirname + url,
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.end(data);
  });
}).listen(8000);

// 终端打印如下信息
console.log('Server running at http://localhost:8000/');
