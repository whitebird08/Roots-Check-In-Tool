// Requires
var bodyParser = require('body-parser');
var https = require('https');
var _ = require('lodash');
var moment = require('moment');
var moment_timezone = require('moment-timezone');
var Teacher = require('../models/teacher');
var Zone = require('../models/zone');

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

	// getUserInfo: function(req, res) {
	// 	res.cookie('googleId', req.body.id);
	// 	res.cookie('name', req.body.name);
	// 	res.cookie('image', req.body.image);
	// }


	groveOverview: function(req, res, socket) {
		var user = {
			id: req.cookies.googleId,
			name: req.cookies.name,
			image:  req.cookies.image
		}
		res.render('grove-overview', {user: user});
	},

	getZones: function(req, res){
		Zone.find({}, function(err, zones) {
			if (err) {
				console.error(err);
				res.status(500).send(err);
			} else {
				res.send(zones);
			}
		});
	},

	addTeachertoZone: function(req, res){
		var data = req.body;
		data = JSON.parse(data.data);
		var teacher = data.teacher_id;
		var zone_request = data.zone;
		Zone.findOne({}, function(err, zone) {
			if(!zone){
				var json = {
					"zone-flex": [],
					"zone-maker": [],
					"zone-ipad": [],
					"zone-library": [],
					"zone-writing": []
				};
				json[zone_request].push(teacher);
				Zone.create(json, function(err, zone) {
					if (err) {
						console.error(err);
						res.send(err);
					}
					else {
						res.send(zone);
					}
				});
			}
			else{
				zone[zone_request].push(teacher);
				zone.update({$set: zone }, function(err, result) {
					if (err) {
						console.error(err);
						res.send(err);
					}
					else {
						// Send back the entire use object, extended with the new data, because the update results just give us number of documents affected
						res.send( _.extend(zone) );
					}
				});
			}
		});
	},

	removeTeacherFromZone: function(req, res){
		var data = req.body;
		data = JSON.parse(data.data);
		console.log(data);
		var teacher = data.teacher_id;
		var zone_request = data.zone;
		Zone.findOne({}, function(err, zone) {
			if(!zone){
				console.log("Error: you are trying to remove teachers but there are none assigned")
			}
			else{
				console.log(zone);
				teacher_array = zone[zone_request];
				new_teacher_array = [];
				teacher_array.forEach(function(teach){
					console.log(teach);
					console.log(teach.googleId);
					console.log(teach.googleId != teacher.googleId);
					if (teach.googleId != teacher.googleId){
						new_teacher_array.push(teach);
					}
				});
				zone[zone_request] = new_teacher_array;
				zone.update({$set: zone }, function(err, result) {
					if (err) {
						console.error(err);
						res.send(err);
					}
					else {
						// Send back the entire use object, extended with the new data, because the update results just give us number of documents affected
						res.send( _.extend(zone) );
					}
				});
			}
		});
	}

}

module.exports = teacherController;
