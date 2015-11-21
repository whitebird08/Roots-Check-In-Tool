var indexController = {
	index: function(req, res, socket) {
		res.render('index')
	},
	success: function(req, res) {
		res.render('success')
	},

	whoops: function(req, res){
		res.render('index', {fail: true});
	},

	studentTracker: function(req, res, socket) {
		res.render('student-tracker');
	},

	studentFullSchedule: function(req, res){
		res.render('student-full-schedule');
	},
	groveCalendar: function(req, res){
		res.render('grove-calendar');
	},
	teacherLogin: function(req, res, socket) {
		res.render('teacher-login')
	},
	groveOverview: function(req, res, socket) {
		res.render('grove-overview')
	}
};

module.exports = indexController;
