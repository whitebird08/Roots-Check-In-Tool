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


	groveOverview: function(req, res, socket) {
		res.render('grove-overview');
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
	}

	addTeachertoZone: function(req, res){
		var data = req.body;
		teacher = body.teacher_id;
		zone_request = body.zone;
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
			}
			else{

			}
		}
	}

}

module.exports = teacherController;
