var http=require('http');
var https = require('https')
var fs = require('fs');

const server = http.createServer((req, res) => {
  // 这里可以设置header信息, 如跨域等信息
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Oring', 'http://127.0.0.1:8080/')
  res.setHeader('Access-Control-Allow-Credentials', true)
}).listen(8090)

const requestHandle = (req, res) => {
  console.log('req', req);
  console.log('res', res);
  // 设置一些 请求处理的方法
  // if (url === '/index') { // 文件的请求
  //     res.writeHead(200, {
  //       'Content-Type': 'text/html'
  //     })
  //     fs.readFile('index.html', 'utf8', function (err, data) {
  //       if (err) throw err
  //       res.end(data)
  //     })
  //  } else if (url === '/api') { // 接口请求
  //     req.on('data', function (pamas) {
  //       console.log('8888888')
  //       // 在此做一些数据的处理
  //     })
  //     req.on('end', () => {
  //         // 请求结束
  //     })
  // } else { // 404 请求
  //     res.write('404')
  //     res.end()
  // }
}

server.on('request', requestHandle)

const dingdingHandle = (str, callback) => {
  // 钉钉报警传参
    const postData = {
      msgtype: "text",
      text: {
        content: str
      },
      "at": {
        "atMobiles": [
            "155********"
        ], 
        "isAtAll": false
      }
    };
  
    const options = {
      hostname: 'oapi.dingtalk.com',
      path: '/robot/send?access_token=d529ae67dcc82157032c3c84bad0c450a2329692adca0e00000efcbddf2898',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      }
    };
  
    const req = https.request(options, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      console.log(`响应头: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        console.log(`响应主体: ${chunk}`);
        callback(chunk)
      });
      res.on('end', () => {
        console.log('响应中已无数据。');
      });
    });
  
    req.on('error', (e) => {
      console.error(`请求遇到问题: ${e.message}`);
    });
  
    // 写入数据到请求主体
    req.write(JSON.stringify(postData));
    req.end();
  }