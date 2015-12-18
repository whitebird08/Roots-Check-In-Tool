var mongoose = require('mongoose');

var teacherSchema = mongoose.Schema ({
	googleId: String,
	name: String,
	email: String,
	image: String,
	access_token: String
});

module.exports = mongoose.model('teacher', teacherSchema);
