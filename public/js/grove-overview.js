require('jquery');
require('jquery-ui');

// function from scotch tutorial to parse cookie https://scotch.io/quick-tips/easily-create-read-and-erase-cookies-with-jquery
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function getCurrentTeacher() {
	console.log(document.cookie);
	return readCookie('googleId');
};

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
};

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

function toggleWatching(zone){
	//check watching class to see if zone is active
	if($(zone).hasClass( "currently-watching" )){
		$(zone).removeClass( "currently-watching");
		tapout(zone);
	}
	else {
		$(zone).addClass("currently-watching");
		tapin(zone);
	}
}

function tapin(zone){
	console.log("you are the zone: "+ zone.id);
	googleId = getCurrentTeacher();
	console.log(googleId);
	data = {
		teacher_id: googleId,
		zone: zone.id
	};
	url = "/api/zone";
	$.ajax({
		url: url,
		type: "POST",
		data: {data: JSON.stringify(data)},
		dataType: "json",
		success: function(){
			refreshMap();
		}
	});

}

function tapout(zone){
	console.log("Removed from zone: "+ zone.id);
	data = {
		teacher_id: getCurrentTeacher(),
		zone: zone.id
	};

	url = "/api/zone/remove";
	$.ajax({
		url: url,
		type: "POST",
		data: {data: JSON.stringify(data)},
		dataType: "json",
		success: function(){
			refreshMap();
		}
	});


}

function refreshMap(){
	console.log("refreshing the map");
	// Add currently-watching class to any class they are currently watching

	// Add Avitar to currently watching

	// Add other teachers Avitars to the other teachers area

	// update counts of students

}

// getStudents();
getZones();

$(document).ready( function(){
	refreshMap();

	$(".container a").each(function(index, el){
		$(el).on("click", function(){
			toggleWatching(el);
		});
	})
});
