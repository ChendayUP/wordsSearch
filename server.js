const Koa = require('koa');
var bodyParser = require('koa-bodyparser');
var Router = require('koa-router');
var https = require('https');
var http = require('http');
var pdfreader = require('pdfreader')
var mammoth = require("mammoth");
const fs = require('fs');
const download = require('download');

//外站接口
// const url = 'http://www.ccgp-sichuan.gov.cn/cms/newscontent/contentupload/file/2020-09/32b3aa5d_5761_4037_850c_6ad102b9e725.pdf';
console.log('服务启动')

String.prototype.endWith = function (s) {
  var d = this.length - s.length;
  return (d >= 0 && this.lastIndexOf(s) == d)
}
async function bufferize(url) {
  var hn = url.substring(url.search("//") + 2);
  hn = hn.substring(0, hn.search("/"));
  var pt = url.substring(url.search("//") + 2);
  pt = pt.substring(pt.search("/"));
  const options = { hostname: hn, port: 443, path: pt, method: "GET" };
  return new Promise(function (resolve, reject) {
    var buff = new Buffer.alloc(0);
    const req = http.request(url, (res) => {
      console.log('请求中');
      res.on("data", (d) => {
        buff = Buffer.concat([buff, d]);
      });
      res.on("end", () => {
        resolve(buff);
      });
    });
    req.on("error", (e) => {
      console.error("https request error: " + e);
    });
    req.end();
  });
}
async function readlines(buffer, xwidth) {
  return new Promise((resolve, reject) => {
    var pdftxt = new Array();
    var pg = 0;
    new pdfreader.PdfReader().parseBuffer(buffer, function (err, item) {
      if (err) console.log("pdf reader error: " + err);
      else if (!item) {
        pdftxt.forEach(function (a, idx) {
          pdftxt[idx].forEach(function (v, i) {
            pdftxt[idx][i].splice(1, 2);
          });
        });
        resolve(pdftxt);
      } else if (item && item.page) {
        pg = item.page - 1;
        pdftxt[pg] = [];
      } else if (item.text) {
        var t = 0;
        var sp = "";
        pdftxt[pg].forEach(function (val, idx) {
          if (val[1] == item.y) {
            if (xwidth && item.x - val[2] > xwidth) {
              sp += " ";
            } else {
              sp = "";
            }
            pdftxt[pg][idx][0] += sp + item.text;
            t = 1;
          }
        });
        if (t == 0) {
          pdftxt[pg].push([item.text, item.y, item.x]);
        }
      }
    });
  });
}

const list = ['财政资金', '一般公共预算资金', '财政性资金']
const list2 = ['自筹资金']
var app = new Koa();
var router = new Router();
app.use(bodyParser());
router.post('/node/sourceType', async (ctx, next) => {
  // handle your post request here
  let { url } = ctx.request.body
  console.log(url);
  let file = await download(url, 'dist');
  console.log('下载 ', file);
  return
  let search = null
  let searchLines = []
  if (url.toLowerCase().endWith('pdf')) {
    var buffer = await bufferize(url)
    var lines = await readlines(buffer)
    lines = await JSON.parse(JSON.stringify(lines))
    
    for (const key in lines) {
      let page = lines[key]
      for (const sub in page) {
        let line = page[sub][0]
        list.forEach(word => {
          if (line.search(word) > 0) {
            search = '财政资金'
            searchLines.push(line)
          }
        })
        list2.forEach(word => {
          if (line.search(word) > 0) {
            search = '自筹资金'
            searchLines.push(line)
          }
        })
      }
    }
  } else {
    mammoth.extractRawText({path: url})
    .then(function(result){
      console.log('doc ', result);
        var text = result.value; // The raw text
        var messages = result.messages;
    })
    .done();
  }
  
  if (search) {
    ctx.body = {
      code: 200,
      data: {
        type: search,
        lines: searchLines
      }
    };
  } else {
    ctx.body = {
      code: 200,
      data: {
        type: '其他',
        lines: searchLines
      }
    };
  }
  console.log(searchLines)
  console.log('-----------------------------------请求结束------------------------')
})
// app.use(async ctx => {
//   console.log(ctx.request)
//   let { url } = ctx.request.body
//   var buffer = await bufferize(url)
//   var lines = await readlines(buffer)
//   lines = await JSON.parse(JSON.stringify(lines))
//   for (const key in lines) {
//     let page = lines[key]
//     for (const sub in page) {
//       let line = page[sub][0]
//       list.forEach(word => {
//         if (line.search(word) > 0) {
//           console.log(line)
//           ctx.body = line;
//           ctx.response = line
//         }
//       })
//     }
//   }
// });
app
  .use(router.routes())
  .use(router.allowedMethods());
app.listen(3000);
console.log('服务启动: 3000')