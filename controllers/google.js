var https = require('https');
var User = require('../models/user');
var _ = require('lodash');

var googleController = {
	getProfile: function(req, res) {
		
		// var options = {
		// 	url: 'googleapis.com/',
		// 	path: '/plus/v1/people/' + req.body.userid,
		// 	headers: {
		// 		Authorization: 'Bearer ' + req.body.access_token,
		// 		'x-li-format': 'json'
		// 	}
			
		// };

		// https.get(options, function(response) {
		// 	var datastring = '';
		// 	response.on('data', function(data){
		// 		datastring += data;
		// 		console.log('dat type', typeof data);
		// 	});

		// 	response.on('error', function(err){
		// 		console.log('error:', err);
		// 	})

		// 	response.on('end', function() {
		// 		console.log('type of all data:', typeof datastring);
		// 		console.log('All data:', datastring)
		// 		res.send({ message: 'hello'});
		// 	});
		// });
	
		// Make the request to google to get the email and name of the user
		https.get('https://www.googleapis.com/plus/v1/people/'+ req.body.userid +'?access_token=' + req.body.access_token, function(response) {
			var datastring = '';
			
			// Accumulate the response data into a string
			response.on('data', function(data){
				datastring += data;
			});

			// When the response is done, save and return the saved user object
			response.on('end', function() {
				var data = JSON.parse(datastring);
				
				// See if there is already a user with this user id
				User.findOne({ googleId: data.id}, function(err, user) {

					// If there is a user, update the access_token and send it back
					if (user) {
						user.update({access_token: req.body.access_token}, function(err, num, updated_user) {
							if (err) {
								console.log(err);
								res.send(err);
							}
							else {
								res.send({id: data.id});
							}
						});
					}
					// If there is not a user, save it and send back the results
					else {
						User.create({
							email: data.emails[0].value,
							googleId: data.id,
							name: data.displayName,
							access_token: req.body.access_token,
							calendar: []
						}, function(err, user) {
							if (err) {
								console.error(err);
								res.send(err);
							}
							else {
								res.send({id: data.id});
							}
						});

					}
				})
			});
		});
	},

	getCalendar: function(req, res) {
		var id = req.params.id; 
		console.log('id', id);
		User.findOne({googleId : id}, function(err, results) {
			console.log('results email', results.email);
			var googleEmail = results.email;
			https.get('https://www.googleapis.com/calendar/v3/calendars/' + googleEmail + '/events/?access_token=' + results.access_token , function(response){
				var datastring = '';
			
				// Accumulate the response data into a string
				response.on('data', function(data){
					datastring += data;
				});

				response.on('end', function() {
					var data = JSON.parse(datastring);
					var events_array = data.items;
					console.log('datastring structure', _.keys(data))
					console.log('Maybe this will work:', events_array.slice(-5))
				});
				
			});

			res.send(results);
		});


		// User.findOne({id: req.params.id}, function(err, doc){
		// 	console.log('hello')
		// })
		 
		// console.log('userid req', req.body.userid);

		// https.get('https://www.googleapis.com/calendar/v3/calendars/'+ req.body.userid +'?access_token=' + req.body.access_token, function(response) {
		// 	var datastring = '';
	}
};

module.exports = googleController; 