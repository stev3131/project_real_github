const app = require('express')();
const server = require('http').createServer(app);
const express = require('express');
const body_parser = require('body-parser');
const mysql = require('mysql');
const io = require('socket.io')(server);

//take the side of site cioè i parametri del form
app.use(body_parser.json());
app.use(body_parser.urlencoded({extended: true}));
app.use(express.static(__dirname + '/img/'));

//variabili globali
let userAlready = " ",maxRoom = [];

//database setup
var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "credentials"
});

async function db_connect () {
	await con.query("SELECT * FROM utente", (err, result, fields) => {
	  if (err) throw err;
	 	jsonUtente = JSON.stringify(result);
		console.log(JSON.parse(JSON.stringify(jsonUtente)));
	});
};

db_connect().catch(err => console.log(err));

//layout register pagina web
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/public_html/register.html');
});

//layout home e login pagina web
app.get('/', (req, res) => {
	if(userAlready == " ")
		res.sendFile(__dirname + '/public_html/login.html');
	else
		res.sendFile(__dirname + '/public_html/homepage.html');
});

//i due post per verificare i dati del form
app.post('/login-user', (req,res) => {
  let json_data = JSON.parse(jsonUtente);
	let c = 0;
  userName = req.body.name;
  pwd = req.body.pwd;
  for(var i in json_data){
		if(userName == json_data[i].userName || userName == json_data[i].email && pwd == json_data[i].pwd){
			c = 1;
			break;
		}
	}
	if(c == 1){
    userAlready = userName;
		res.redirect('/');
	}else{
		res.redirect('/');
	}
});

app.post('/register-user', (req,res) => {
  let json_data = JSON.parse(jsonUtente);
	let c = 0;
  userName = req.body.name;
  email = req.body.email;
  pwd = req.body.pwd;
  pwd2 = req.body.pwd2;
  for(var i in json_data){
    if(userName == json_data[i].userName || userName == json_data[i].email || pwd != pwd2){
			c = 1;
		}
  }
  if(c != 1){
    //aggiungiamo i record al databse
    const userNew = { userName:userName, email: email, pwd: pwd};
		con.query('INSERT INTO utente SET ?', userNew, (err, res) => {
		  if(err) throw err;
		});
    //aggiorniamo la variabile del database
    db_connect().catch(err => console.log(err));
    userAlready = userName;
		res.redirect('/');
	}else{
		res.redirect('/register');
	}
})

//visuallizare per il metodo ajax i dati del databse
app.get('/database/user.js', (req, res) => {
  let jsonAllUser = [];
  let json_data = JSON.parse(jsonUtente);
  for(var i in json_data){
    jsonAllUser.push(json_data[i].userName)
  }
  res.setHeader('Content-Type', 'application/json');
  res.send(jsonAllUser);
});

//aggiungi chat con cui conversare before layout and after controlli
app.get('/joinChat',(req, res) => {
  if(userAlready != " ")
    res.sendFile(__dirname + '/public_html/joinChat.html');
  else
    res.redirect('/');
})
  //aggiungere chat dell'utente la nuova chat
app.post('/joinChatReg',(req, res) =>{
  if(userAlready != " "){
    userC = req.query.name;
  }else
    res.redirect('/');
})

//videochat configurazione before layout //room instance e socket della stanza
app.get('/prevideo',(req, res) => {
  if(userAlready != " ")
    res.sendFile(__dirname + '/public_html/prejoinChat.html');
  else
    res.redirect('/');
})
app.get('/geneRoom',(req, res) => {
  s = req.query.room;
  if(s == "create"){
    roomId = Math.floor((Math.random() * 100000000000000))
    for(var i = 0; i < maxRoom.length; i++){
      if(roomId == maxRoom[i])
        i--;
    }
    maxRoom.push(roomId)
    res.redirect(`/room/?roomId=${roomId}`);
  }else{
    index = Math.floor((Math.random() * maxRoom.length))
    res.redirect(`/room/?roomId=${maxRoom[index]}`);
  }
})
app.get('/room', (req, res, next) => {
  res.sendFile(__dirname + '/public_html/room.html');
});
app.get('/js/webcam.js', (req, res) => {
	 res.sendFile(__dirname + '/js/webcam.js');
});
io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) =>{
			socket.join(roomId)
    	socket.to(roomId).broadcast.emit('user-connected', userId)
			socket.on('disconnect', () => {
      	socket.to(roomId).broadcast.emit('user-disconnected', userId)
    	})
		});
});

server.listen(3000,function(){
	console.log("Server is running");
});
