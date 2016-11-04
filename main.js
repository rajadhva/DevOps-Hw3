var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var http = require('http')
var app = express()
var http_proxy = require('http-proxy')
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})

client.set()

globalPortCount = 0; 
generatePortCount = 0;
basePort = 5000;
var portNumbers = [];
///////////// WEB ROUTES

// Create HTTP Proxy

var proxy = http_proxy.createProxyServer({});

var proxyServer = http.createServer(function(req,res) {
    client.rpoplpush('proxyQueue','proxyQueue', function(err,reply) {
        console.log("Switching" + reply );
        var url = 'http://localhost:' + reply
		proxy.web(req, res, {target: url});
    })
}).listen(80)

// proxyServer.listen(80, function() {
// 	console.log("listening on port 80")
// });


// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next) 
{
	console.log(req.method, req.url);

	// ... INSERT HERE.

	client.lpush("list" , req.url);
	client.ltrim("list" , 0 ,4);


	next(); // Passing the request to the next handler in the stack.
});


app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
//   console.log(req.body) // form fields
//   console.log(req.files) // form files

   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		console.log(img);
	  		client.lpush("images" , img);
		});
	}

   res.status(204).end()
}]);

app.get('/meow', function(req, res) {
		res.writeHead(200, {'content-type':'text/html'});

		client.lpop('images', function(err,value){

			if(!value){
				res.end();
			}
			else{
				res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+value+"'/>");
            	res.end();
			}

		})
})

// HTTP SERVER
var server1 = app.listen(3000, function () {

  var host1 = server1.address().address
  var port1 = server1.address().port

  console.log('Example app listening at http://%s:%s', host1, port1)
})

//HTTP SERVER 2
var server2 = app.listen(3001, function () {

  var host2 = server2.address().address
  var port2 = server2.address().port

  console.log('Example app listening at http://%s:%s', host2, port2)
  createProxyQueue()
})

function createProxyQueue()
{
	client.del('proxyQueue', function(err, reply){})
	client.lpush('proxyQueue', 3000, function(err, reply){})
	client.lpush('proxyQueue', 3001, function(err, reply){})

}



app.get('/', function(req, res) {
  res.send('hello world')
})

app.get('/recent', function(req, res) {
  
  client.lrange("list" , 0 ,4 , function(req, res2) { res.send(res2)});
  
})


app.get('/set',  function(req, res) {
  client.set("key" , "val1");
  client.expire("key" ,10);
})


app.get('/get',  function(req, res) {
  client.get("key", function(err,value){ res.send(value)});
  });


app.get('/spawn', function(req, res){

	if(globalPortCount==0){
	client.del("servers", function(err, reply){})
	}
	
	generatePortCount = generatePortCount + 1;
	globalPortCount = globalPortCount +1;
	port = basePort + generatePortCount;
	portNumbers.push(parseInt(port));
	var server = app.listen(port, function () {

		var host = server.address().address
  		var port = server.address().port

  		console.log('Example app listening at http://%s:%s', host, port)
})
	client.lpush("servers", parseInt(port), function(err, value){
		console.log("After spawning ", value)
	});
	res.send("New server created at" + port);
})

app.get('/destroy', function(req, res){
	
	if(globalPortCount>1){
		port = portNumbers.splice(Math.floor(Math.random() * portNumbers.length), 1);
		client.lrem("servers", 0, parseInt(port), function(err, value){
		globalPortCount = globalPortCount - 1;	
	});

	res.send("Server destroyed" +  " " + port);	
	}
	else{
		res.send("Only 1 server ,cannot be destroyed");
	}
})

app.get('/listservers', function(req, res){
	client.lrange("servers", 0, -1, function(req,res2){ res.send(res2) });
})
