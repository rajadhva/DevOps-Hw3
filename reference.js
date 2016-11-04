var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var http = require('http')
var app = express()
var httpProxy = require('http-proxy')
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {})

var numPorts = 0;
var defaultPort = 4000;

// Proxy server
var proxy = httpProxy.createProxyServer({});

http.createServer(function(req, res) {
	client.rpoplpush('proxyQueue', 'proxyQueue', function(err, reply){
		console.log('Choosing ',reply)
		var url = 'http://localhost:' + reply
		proxy.web(req, res, {target: url});	
	})
  	
}).listen(80);

///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
app.use(function(req, res, next) 
{
	console.log(req.method, req.url);

	// ... INSERT HERE.
	client.lpush("mylist", req.url);
	client.ltrim("mylist", 0, 4)
	next(); // Passing the request to the next handler in the stack.
});

app.get('/', function(req, res) {
  res.send('hello world')
})

app.get('/set', function(req, res){
	var key = "key"
	client.set(key, "this message will self-destruct in 10 seconds");
	client.expire(key, 10)
	res.send('Key set')
})

app.get('/get', function(req, res){
	client.get("key", function(err,value){ res.send(value)});
})

app.get('/recent', function(req, res){
	client.lrange("mylist", 0, 4, function(err,value){ res.send(value)});
})

app.get('/spawn', function(req, res){
	client.del("servers", function(err, reply){})
	var server = createServer();
	var host = server.address().address
	var port = server.address().port
	client.lpush("servers", parseInt(port));
	client.lrange("servers", 0, -1, function(err,list){ 	
		console.log("Server list after spawning is ",list);
	});	
	
	res.send("Server spawned")
})

app.get('/destroy', function(req, res){
	var port = getRandomPortNumber();
	client.lrem("servers", 0, parseInt(port), function(err, value){
		numPorts = numPorts - 1;
	});
	res.send('Server at port number' + port + 'destroyed')
	client.lrange("servers", 0, -1, function(err,value){ console.log("Server list after destroy is ", value)});
})

function getRandomPortNumber()
{
	// if(numPorts == 1)
	// {
	// 	return defaultPort + 1;
	// }

	var n = Math.floor((Math.random() * (num - 1)) + 1);
	return defaultPort + n;
} 

app.get('/listservers', function(req, res){
	client.lrange("servers", 0, -1, function(err,value){ console.log("Server list is ", value)});
})

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   console.log(req.body) // form fields
   console.log(req.files) // form files

   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		console.log(img);
	  		client.lpush("imglist", img)
		});
	}

   res.status(204).end()
}]);

app.get('/meow', function(req, res) {
	{
		client.lpop("imglist", function(err,imagedata){
			res.writeHead(200, {'content-type':'text/html'});
			res.write("<h1>\n<img src='data:my_pic.jpg;base64,"+imagedata+"'/>");
			res.end();
		});
	}
})

function createServer()
{
	numPorts = numPorts + 1;
	var port = defaultPort + numPorts;
	var server = app.listen(port, function () {
		var host = server.address().address
		var port = server.address().port

	console.log('Example app listening at http://%s:%s', host, port)
	})	
	return server;
}


// HTTP SERVER
var server1 = app.listen(3000, function () {

var host1 = server1.address().address
var port1 = server1.address().port

console.log('Example app listening at http://%s:%s', host1, port1)
})

// Another server
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
