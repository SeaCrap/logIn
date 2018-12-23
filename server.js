var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号？像这样\nnode server.js 8888 或 \nnode server 8080 这样设置！')
  process.exit(1)
}

var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url 
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method 

/******** 从这里开始看，上面不要看 ************/
    
  
  console.log('打印：含查询字符串的路径\n' + pathWithQuery)
    
  
  
  if(path === '/'){
    let string = fs.readFileSync('./index.html','utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  }else if(path === '/sign_up' && method === 'GET'){
    let string = fs.readFileSync('./sign_up.html','utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  }else if(path === '/sign_up' && method === 'POST'){
    readBody(request).then((body)=>{
      //console.log(body)//请求体
      let strings = body.split('&')//把数据分割成一个数组：['email=x', 'password=xx', 'password_confiramation=xx']
      let hash = {}
      strings.forEach((string)=>{ //遍历strings
        //string == 'email=x'…
        let parts = string.split('=')//把数据片段(比如'email=x')分割成两部分 ['email', 'x'…]
        let key = parts[0] //parts的第一个部分 比如 'email'
        let value = parts[1]//parts的第二部分 比如 'x'
        hash[key] = value //hash['email'] = 'x' 
      })
        console.log(hash)
      //生成三个变量
      //let email = hash['email']
      //let password = hash['password']
      //let password_confiramation = hash['password_consiramartions']
      // ES6 可以简写 等于上边三句
      let {email, password, password_confiramations} = hash
      //做验证判断
      if(email.indexOf('@') === -1){ // indexOf:检索email内没有 @ 符号 为 -1
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.statusCode = 400
        response.write(`{  
          "errors":{
            "email": "invalid"
          }
        }`)
      }else if(password !== password_confiramations){
        response.statusCode = 400
        response.write('password not match')
      }else{
        response.statusCode = 200
      }
      response.end()
    })
  }else if(path === '/main.js'){
    let string = fs.readFileSync('./main.js','utf8')
    response.statusCode = 200 
    response.setHeader('Content-Type', 'text/javascript;charset=utf-8')
    response.write(string)
    response.end()
  }else if(path === '/yyy'){
    let string = fs.readFileSync('./main.js','utf8')
    response.statusCode = 200
    response.setHeader('Content-Type', 'text/json;charset=utf-8')
    //CORS跨域方案：告诉浏览器不要阻止 http://mrli.com:8801
    response.setHeader('Access-Control-Allow-Origin', 'http://mrli.com:8801')
    response.write(`
    {
      "note":{
        "to": "张三",
        "from": "李四",
        "heading": "打招呼",
        "content": "hi"
      }    
    }  
    `)
    response.end()
  }else{
    response.statusCode = 404
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(`
      {
        "error" : "not found" 
      }  
    `)
    response.end()
  }

  /******** 代码结束，下面不要看 ************/
})

function readBody(request){
  return new Promise((resolve,reject)=>{
    let body = [] //生成一个空数组
    request.on('data', (chunk)=>{ //监听 data 事件 
      body.push(chunk); // 每次用户传过来的数据片段都放到数组里
    }).on('end', ()=>{ // 结束之后 把 数组内的数据(字符串)拼接起来
      body = Buffer.concat(body).toString();
      resolve(body)
    })
  })
}

server.listen(port)
console.log('监听 ' + port + ' 成功\n请复制到浏览器地址栏中打开 http://localhost:' + port)
