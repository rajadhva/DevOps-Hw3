Cache, Proxies, Queues
=========================

#### Setup

Install redis
Start redis server by the command redis-server
run npm install
run sudo node main.js to start

##### Tasks Completed

1. The created server can be accessed using localhost:3000. The /se route sets a key and a value. Also this key expires in 10 secs. the /get route is used to fetch the value which will not be able to be seen after 10 secs. 

2. The /recent route gives us the last 5 routes that have been visited. this is being stored in a list and the lpush,ltrim and lrange operations are being used to add ,maintain 5 recent urls and return the list respectively.

3. The curl -F "image=@./img/i-scream.jpg" localhost:3000/upload command is being used to upload the images that can be seen by visiting the route /upload . the /meow route displays the last image that has been added and also removes it from the list using the lpop operation.

4. the /spawn command is being used to create a new server running on a different port. I have specified a base port which is being incrmeneted to create new ports. Also i'm keeping a global count of the ports that are currently in use. The ports are being stored in a servers list. The /destroy route is used to destroy and exsting server. The ports are being randomly choosen and the lrem command is being used to remove the server.The /listservers is being used to display the current servers in use , by using the lrange command.

5. I have created a proxy server on port 80 ,with 2 servers on port 3000 and 3001. I'm toggling between the 2 using the rpoplpush. The 2 servers are being togged each time a visit to http:localhost/3000 takes place. 

#### Screencast

https://www.youtube.com/watch?v=Jh2FSz1qHzg&feature=youtu.be
