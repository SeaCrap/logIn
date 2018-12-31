var http = require('http')
var fs = require('fs')
var url = require('url')
var port = process.argv[2]

if(!port){
  console.log('请指定端口号？像这样\nnode server.js 8888 或 \nnode server 8080 这样设置！')
  process.exit(1)
}
//一个空对象
let sessions = {

}

var server = http.createServer(function(request, response){
  var parsedUrl = url.parse(request.url, true)
  var pathWithQuery = request.url 
  var queryString = ''
  if(pathWithQuery.indexOf('?') >= 0){ queryString = pathWithQuery.substring(pathWithQuery.indexOf('?')) }
  var path = parsedUrl.pathname
  var query = parsedUrl.query
  var method = request.method 
  var md5 = require('md5');

  /******** 从这里开始看，上面不要看 ************/


  console.log('打印：含查询字符串的路径\n' + pathWithQuery)



  if(path === '/'){
    let string = fs.readFileSync('./index.html','utf8')
    //这里 cookies 有可能是空 split() 可能会报错 undefined 所以这里如果cookies 存在 再分割
    let cookies = ''//这里默认为空 就有 length 了
    if(request.headers.cookie){
     cookies = request.headers.cookie.split('; ')
    }
    let hash = {}
    for(let i=0; i<cookies.length; i++){
      let parts = cookies[i].split('=')
      let key = parts[0]
      let value = parts[1]
      hash[key] = value
    }
    let mySession = sessions[hash.sessionId]
    let email// = hash.sign_in_email
    if(mySession){
      email = mySession.sign_in_email
    }
    let users = fs.readFileSync('./db/users.json', 'utf8')
    users = JSON.parse(users)
    let foundUser
    for(let i=0; i<users.length; i++){
      if(users[i].email === email){
        foundUser = users[i]
        break
      }
    }
    if(foundUser){
      string = string.replace('__password__', foundUser.password)    
      console.log(foundUser.password)
    }else{
      string = string.replace('__password__', '未登录 密码未知')
    }

    response.statusCode = 200
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  }else if(path === '/js/main.js'){
    let string = fs.readFileSync('./js/main.js','utf8')
    response.setHeader('Content-Type','application/javascript; charset=utf8')
    //response.setHeader('Cache-Control', 'max-age=30')
    let fileMd5 = md5(string)
    response.setHeader('ETag',fileMd5)
    if(request.headers['if-none-match'] === fileMd5){
      // 没有响应体
      response.statusCode = 304
    }else {
      response.write(string)
    }
    response.end()
  }else if(path === '/css/default.css', 'utf8'){
    let string = fs.readFileSync('./css/default.css','utf8')
    response.setHeader('Content-Type','text/css; charset=utf8')
    response.setHeader('Cache-Control', 'max-age=30')
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
      let strings = body.split('&')
      let hash = {}
      strings.forEach((string)=>{ 
        let parts = string.split('=')
        let key = parts[0] 
        let value = parts[1]
        hash[key] = decodeURIComponent(value) 
      })
      let {email, password, password_confirmation} = hash
      //做验证判断
      if(email.indexOf('@') === -1){
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.statusCode = 400
        response.write(`{  
          "errors":{
            "email": "invalid"
          }
        }`)
        console.log(password)
        console.log(password_confirmation)
      }else if(password !== password_confirmation){
        response.statusCode = 400
        response.write('password not match')
      }else{
        var users = fs.readFileSync('./db/users.json','utf8')
        try{
          users = JSON.parse(users)
        }catch(exception){
          users = []
        }
        let inUse = false 
        for(let i=0; i < users.length; i++){
          let user = users[i]
          if(user.email === email){
            inUse = true
            break;
          }
        }
        if(inUse){
          response.statusCode = 400
          response.write(`{
            "errors2":{
              "email": "inUse"
            }
          }`)
        }else{
          users.push({email: email, password: password}) 
          var usersString = JSON.stringify(users)
          fs.writeFileSync('./db/users.json', usersString)
          response.statusCode = 200
        }
      }
      response.end()
    })
  }else if(path === '/sign_in' && method === 'GET'){
    let string = fs.readFileSync('./sign_in.html','utf8')
    response.statusCode = 200 
    response.setHeader('Content-Type', 'text/html;charset=utf-8')
    response.write(string)
    response.end()
  }else if(path === '/sign_in' && method === 'POST'){
    readBody(request).then((body)=>{
      let strings = body.split('&')
      let hash = {}
      strings.forEach((string)=>{ 
        let parts = string.split('=')
        let key = parts[0] 
        let value = parts[1]
        hash[key] = decodeURIComponent(value)  
      })
      let {email, password, password_confirmation} = hash
      var users = fs.readFileSync('./db/users.json','utf8')
      try{
        users = JSON.parse(users)
      }catch(exception){
        users = []
      }
      let found //做下标记
      //验证信息是否匹配
      for(let i=0; i< users.length; i++){
        if(users[i].email === email && users[i].password === password){
          found = true 
          break
        }
      }
      if(found){
        //如果用户信息验证正确
        //之前给用户一个 Cookie
        //这里我们给用户一个SessionId
        let sessionId = Math.random() * 100000 //一个随机数
        sessions[sessionId] = {sign_in_email:email} // sessions 对象的sessionId = 用户的email与我验证一致的email
        response.setHeader('set-Cookie', `sessionId=${sessionId}`)//传给用户一个sessionId
        response.statusCode = 200
      }else{
        response.statusCode = 401
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
