// Requires
var bodyParser = require('body-parser');
var https = require('https');
var _ = require('lodash');
var moment = require('moment');
var moment_timezone = require('moment-timezone');
var Teacher = require('../models/teacher');

function getNotId(data) {
	data = _.pick( data, function(val, key) {
		return key != 'id';
	});

	data = _.mapValues( data, function(val, key) {
		if (val === 'true') return true;
		if (val === 'false') return false;
		return val;
	});

	return data;
}

var teacherController = {
  saveTeacher: function(req, res){
		var data = req.body
		console.log(req.body);
		res.cookie('googleId', req.body.id);
		res.cookie('name', req.body.name);
		res.cookie('image', req.body.image);

		Teacher.findOne({ googleId: data.id}, function(err, teacher) {
			if (!teacher) {
				Teacher.create({
					// email: data.email,
					googleId: data.id,
					name: data.name,
					image: data.image,
					// calendar: data.calendar
				}, function(err, teacher) {
					if (err) {
						console.error(err);
						res.send(err);
					}
					else {
						res.send(teacher);
					}
				});
			} else {
				teacher.update({$set: getNotId(data) }, function(err, result) {
					if (err) {
						console.error(err);
						res.send(err);
					}
					else {
						// Send back the entire use object, extended with the new data, because the update results just give us number of documents affected
						res.send( _.extend(teacher, data) );
					}
				});
			}
		});
	},

	teacherStatus: function(req, res){
		var data = req.body
		console.log("teacherstatus")
		console.log(data)
	}

}

module.exports = teacherController;
