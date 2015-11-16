// Requires
var _ = require('lodash');
var moment = require('moment');
var moment_timezone = require('moment-timezone');
var Scan = require('../models/Scan');
var User = require('../models/user');


// Globals, using process.env (set in minutes) with some default values
var TRANSITION_LENGTH = Number(process.env.TRANSITION_LENGTH) || 6;
TRANSITION_LENGTH = TRANSITION_LENGTH * 60 * 1000;
var EVENT_LENGTH = Number(process.env.EVENT_LENGTH) || 15;
EVENT_LENGTH = EVENT_LENGTH * 60 * 1000;

// Utils, bound to correct values for event and transition length
var startTimes = _.partial( require('../utils/StartTimes'), EVENT_LENGTH, TRANSITION_LENGTH );
var getCurrentEvent = _.partialRight( require('../utils/GetCurrentEvent'), EVENT_LENGTH, TRANSITION_LENGTH );

/*
	Currently not using this implementation, but keeping this around if we want to switch back.
	This waits until the event is over before checking a student in.

	@param userModel: A mongoose User model item corresponding to the student
	@param index: A number representing the index of grove calendar event to check in
*/
function checkInLater(userModel, index) {
	// The timer should be set to go off when the event is being transitioned out of, i.e. how long from now the event started, adding event length, subtracting transition length
	var diff = startTimes() + EVENT_LENGTH - TRANSITION_LENGTH;

	setTimeout(function(modelItem, ind) {
		modelItem.groveCalendar[ind].checkedIn = true;
		modelItem.save(function(err, result) {
			console.log('result of save:', err, result)
		});
	}, diff, userModel, index);
}

var apiController = {
	// Return all users
	getUsers: function(req, res) {
		User.find({}, function(err, users) {
			if (err) {
				console.error(err);
				res.status(500).send(err);
			} else {
				res.send(users);
			}
		});
	},

	// Return one user
	getUser: function(req, res) {
		User.findOne({googleId: req.params.id}, function(err, user) {
			if (err) {
				console.error(err);
				res.status(500).send(err);
			} else {
				res.send(user);
			}
		});
	},

	/*
		On receiving a scan, we need to do several things:
		1. Check if the scan is correct.
		2. Broadcast the scan so the student tracker has up-to-date information and so that the student's application will close.
		3. If there is a current event AND the student has already scanned into that event correctly, we do not want to overwrite the current and correct scan (this is to cover edge cases such as students checking into the correct location, then checking into the wrong one, which would throw off getCurrentEvent ).
		4. In other circumstances, overwrite the students scan with the most recent one.
		5. Redirect the student to the home page for either a SUCCESS or WHOOPS.
	*/
	saveScan: function(req, res, socket) {

		var scanned_data = req.query.scanned_data;
		var googleId = req.params.id;

		if (scanned_data) {
			User.findOne({googleId: googleId}, function(err, user) {
				if (err) {
					console.error(err);
					res.status(500).send(err);
				} else if (!user) {
					res.status(404).send("Student not found");
				} else {
					/*
						Get the current event. If nothing is returned, that means either there is no event and no grove calendar (we send an error), or the student has checked into all of their grove events, in which case we will want to uncheck them all and start at the top.
					*/

					var currentEvent = getCurrentEvent(user);

					if (!currentEvent && !_.isEmpty(user.groveCalendar) ) {
						_.each(user.groveCalendar, function(event) {
							event.checkedIn = false;
						});
						currentEvent = user.groveCalendar[0];
					} else if (!currentEvent) {
						res.status(500).send("Student has no Grove Calendar and no current event was found");
					}

					// Was it correct?
					var correct = currentEvent.location === scanned_data;

					var newScan = {
						googleId: user.googleId,
						name: user.name,
						email: user.email,
						image: user.image,
						time: Date.now(),
						formattedTime: moment_timezone().tz("America/Denver").format('MMMM Do YYYY, h:mm:ss a'),
						scannedLocation: scanned_data,
						event: [currentEvent],
						correct: correct
					};

					/*
						We want to make sure the scan is broadcast even if there are issues saving it, so we broadcast before we save, and nothing needs be done upon saving.
					*/
					socket.emit('SCAN!', newScan);
					Scan.create( newScan );

					// Update the user
					user.recentScan = newScan;
					if (correct) {
						user.recentCorrectScan = newScan;
						if (currentEvent.checkedIn === false) {
							user.groveCalendar = _.map( user.groveCalendar, function(c) {
								if (c._id === currentEvent._id) {
									c.checkedIn = true;
								}
								return c;
							});
						}
					}

					user.save( function( err, result) {
						// Redirect the user based on whether the scan was correct or not. If there was an error saving the user, send that because we want them to try scanning in again.
						if (err) {
							console.error(err);
							res.status(500).send(err);
						} else if (correct) {
							res.redirect('/success');
						} else {
							res.redirect('/whoops');
						}
					});
				}
			})
		}
		else {
			res.render('index')
		}
	},

	// Get current event for a user
	getCurrentEvent: function(req, res) {
		User.findOne({googleId: req.params.user_id}, function(err, user) {
			if (err) {
				console.error(err);
				res.status(500).send(err);
			} else {
				var currentEvent = getCurrentEvent(user);

				if (currentEvent) res.send(currentEvent);
				else if (!_.isEmpty(user.groveCalendar) ) {
					res.send(user.groveCalendar[0]);
				} else {
					res.status(404).send("Could not find next event");
				}
			}
		})
	},

	// Return grove calendar for one student
	getGroveCalendar: function(req, res) {
		User.findOne({googleId: req.params.user_id}, function(err, user) {
			if (err) {
				console.error(err);
				res.statu(500).send(err);
			} else if (!user) {
				res.status(404).send(new Error('User not found!'));
			} else {
				res.send(user.groveCalendar);
			}
		})
	},

	// List all students with basic info + groveCalendar
	listGroveCalendars: function(req, res) {
		User.find({}, function(err, users) {
			if (err) {
				console.error(err)
				res.status(500).send(err);
			} else {
				res.send(_.map(users, function(user) {
					return _.pick(user, ['_id', 'email', 'name', 'image', 'googleId', 'groveCalendar']);
				}));
			}
		});
	},

	// Update one student's groveCalendar
	updateGroveCalendar: function(req, res) {
		User.update({googleId: req.params.user_id}, { groveCalendar: req.body.calendar}, {}, function(err, numAffected){
			if (err) {
				console.error(err);
				res.status(500).send(err);
			} else {
				res.status(200).end();
			}
		});
	},

	// Update all students
	bulkUpdateUsers: function(req, res) {
		User.update( {}, req.body, { multi: true }, function(err, numAffected) {
			if (err) {
				res.status(500).send(err);
			} else {
				res.status(204).end();
			}
		})
	}
};

module.exports = apiController;
