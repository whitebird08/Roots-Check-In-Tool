var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');

var indexController = require('./controllers/index.js');
var googleController = require('./controllers/google.js');
var apiController = require('./controllers/apiController.js');
var teacherController = require('./controllers/teacherController.js');

var app = express();
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());


// SETUP MONGO
var mongoDB_URL = process.env.MONGOLAB_URI || 'mongodb://localhost'
mongoose.connect(mongoDB_URL + '/rootsApp');

// SETUP SOCKETS
var http = require('http').Server(app);
var socket = require('socket.io').listen(http);

// Add a dummy ping to keep connections alive so heroku doesn't kill them
socket.on('connection', function(socket){
	console.log('Someone connected!');

	var pinger = setInterval(function() {
		socket.emit('PING!');
	}, 30000);

	socket.on('disconnect', function() {
		console.log('Someone disconnected!');
		clearInterval(pinger);
	});
});

// ROUTES

app.get('/', function(req, res) {
	indexController.index(req, res, socket);
});

app.get('/scanredirect/:id', function(req, res) {
	apiController.saveScan(req, res, socket);
});

app.get('/success', indexController.success);
app.get('/whoops', indexController.whoops);
app.get('/grove-calendar', indexController.groveCalendar);

app.get('/student-tracker', function(req, res) {
	indexController.studentTracker(req, res, socket);
});

app.get('/teacher-login', function(req, res) {
	indexController.teacherLogin(req, res, socket);
});

app.get('/grove-overview', function(req, res) {
	indexController.groveOverview(req, res, socket);
});


// Student Full schedule
app.get('/student-full-schedule', indexController.studentFullSchedule);

//API Routes
app.put('/api/user/bulk', apiController.bulkUpdateUsers);
app.post('/api/teacher', teacherController.saveTeacher);
app.post('/api/user', googleController.saveUser);
app.get('/api/user', apiController.getUsers);
app.get('/api/user/:id', apiController.getUser);
app.get('/api/grove/:user_id', apiController.getGroveCalendar);
app.put('/api/grove/:user_id', apiController.updateGroveCalendar);
app.get('/api/grove', apiController.listGroveCalendars);
app.get('/current-event/:user_id', apiController.getCurrentEvent)


// io.listen(app);

var port = process.env.PORT || 7060;

var server = http.listen(port, function() {
	console.log('Express server listening on port ' + server.address().port);
});
