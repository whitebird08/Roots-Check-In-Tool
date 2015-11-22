webpackJsonp([1],[
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {__webpack_require__(90);
	__webpack_require__(105);

	function getStudents(){
		var url = "/api/user";
		var students;
		$.ajax({
			url: url,
			dataType: "json",
			success: function(users){
				students = users;
				updateStudentNumbers(students)
			}
		})
	}

	function updateStudentNumbers(students){
		console.log(students);
		var zoneNow = {
			"Flex Center": 0,
			"Maker Center": 0,
			"iPad Center": 0,
			"Library Center": 0,
			"Writing Center": 0
		};
		var zoneNext = {
			"Flex Center": 0,
			"Maker Center": 0,
			"iPad Center": 0,
			"Library Center": 0,
			"Writing Center": 0
		};

	    students.forEach(function(doc) {
	    	if (doc.groveCalendar.length > 0) {
	    		zoneNow[doc.groveCalendar[0].location] += 1
	    	}
	    	if (doc.groveCalendar.length > 1) {
	      		zoneNext[doc.groveCalendar[1].location] += 1
	    	}
	    	//grab element in DOM with jquery and assign
	    	console.log('now: ', zoneNow, 'next: ', zoneNext);
	    });
	}

	function getZones(){
		var url = "/api/zones";
		var zones;
		$.ajax({
			url: url,
			dataType: "json",
			success: function(zones){
				zones = zones;
				updateZoneAssignments(zones)
			}
		})
	}

	function updateZoneAssignments(zones){
		console.log(zones)
	}

	function tapin(zone){
		console.log("you are the zone: "+zone.id);
		data = {
			teacher_id: 54321,
			zone: zone.id
		};
		url = "/api/zone";
		$.ajax({
			url: url,
			type: "POST",
			data: data,
			dataType: "json",
			success: function(){
				refreshMap();
			}
		})


	}

	function refreshMap(){
		console.log("refreshing the map");
	}

	// getStudents();
	getZones();

	$(document).ready( function(){

		$(".container a").each(function(index, el){
			$(el).on("click", function(){
				tapin(el);
			});
		})
	});

	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(90)))

/***/ }
]);