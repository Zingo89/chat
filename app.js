var express = require('express'),
	app = express(),
	server = require('http').createServer(app),
	io = require('socket.io').listen(server),
	users = {};
	
server.listen(3000);

app.get('/', function(req, res){
	res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function(socket){
	socket.on('new user', function(data, callback){
		if (data in users){
			callback(false);
		} else{
			callback(true);
			socket.nickname = data;
			users[socket.nickname] = socket;
			updateNicknames();
		}
	});

	var mysql = require("mysql");


	var connection = mysql.createConnection({
		host: 'robinsingh.se',
		user: "chat",
		password: "chat",
		database: "chat",
	});


	connection.connect(function(err) {
		if(err)
		{
			console.log(err);
		}
		else
		{
			console.log('Connected to MySQL DB');
		}
  		// connected! (unless `err` is set)
	});

	connection.query('SELECT * FROM room', function(err, rows, fields) {
	if (err) throw err;

	  console.log('The solution is: ', rows[0]);
	});

	connection.end();

	
	function updateNicknames(){
		io.sockets.emit('usernames', Object.keys(users));
	}

	socket.on('send message', function(data, callback){
		var msg = data.trim();
		console.log('after trimming message is: ' + msg);
		if(msg.substr(0,3) === '/w '){
			msg = msg.substr(3);
			var ind = msg.indexOf(' ');
			if(ind !== -1){
				var name = msg.substring(0, ind);
				var msg = msg.substring(ind + 1);
				if(name in users){
					users[name].emit('whisper', {msg: msg, nick: socket.nickname});
					console.log('message sent is: ' + msg);
					console.log('Whisper!');
				} else{
					callback('Error!  Enter a valid user.');
				}
			} else{
				callback('Error!  Please enter a message for your whisper.');
			}
		} else{
			io.sockets.emit('new message', {msg: msg, nick: socket.nickname});
		}
	});
	
	socket.on('disconnect', function(data){
		if(!socket.nickname) return;
		delete users[socket.nickname];
		updateNicknames();
	});
});