const http = require('http');

http.createServer(function (request, response) {

    // 发送 HTTP 头部 
    // HTTP 状态值: 200 : OK
    // 内容类型: 纯文本 text/plain
    // 编码类型: utf-8
    response.writeHead(200, {'Content-Type': 'text/plain; charset=utf-8'});

    // 返回内容
    let content = "来自互联网之神的祝福\n\n";

    // 循环十次，不断增加返回内容
    for(let i = 0; i < 10; i++){
        content = content + "Hello World==>" + i + "\n"
    }


    // 发送响应数据 "Hello World"
    response.end(content);

}).listen(8888);

// 终端打印如下信息
console.log('请用浏览器访问 http://127.0.0.1:8888/');