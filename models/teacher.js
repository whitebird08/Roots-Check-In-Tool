var mongoose = require('mongoose');

var teacherSchema = mongoose.Schema ({
	googleId: String,
	name: String,
	email: String,
	image: String,
	access_token: String,
	// absent: Boolean,
	// // calendar_id: String
	// recentScan: {
	// 	time: Number,
	// 	event: [{
	// 		eventId: String,
	// 		location: String,
	// 		start: String,
	// 		end: String,
	// 	}],
	// 	scannedLocation: String,
	// 	correct: Boolean
	// },
	// recentCorrectScan: {
	// 	time: Number,
	// 	event: [{
	// 		eventId: String,
	// 		location: String,
	// 		start: String,
	// 		end: String,
	// 	}],
	// 	scannedLocation: String,
	// },
	// calendar: [{
	// 	eventId: String,
	// 	location: String,
	// 	creator: String,
	// 	start: String,
	// 	end: String,
	// 	activity: String,
	// 	summary: String,
	// }],
	// groveCalendar: [{
	// 	location: String,
	// 	activity: String,
	// 	focus_area: String,
	// 	checkedIn: Boolean
	// }]
});

module.exports = mongoose.model('teacher', teacherSchema);
