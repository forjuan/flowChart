var http = require('http');
var fs = require('fs');

http.createServer(function (req, res) {
  res.writeHead(200);
	// 发送 HTTP 头部
	// HTTP 状态值: 200 : OK
	// 内容类型: text/plain

  // 发送响应数据 "Hello World"
  var url = (req.url == '/') ? '/index.html' : req.url;
    fs.readFile(__dirname + url,
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      res.end(data);
    });
	// response.end('Hello World\n');
}).listen(8000);

// 终端打印如下信息
console.log('Server running at http://localhost:8000/');
