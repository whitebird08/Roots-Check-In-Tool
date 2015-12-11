require('jquery');
require('jquery-ui');
require('handlebars');


function getCurrentTeacher(){
	//pull from cookie or database
	return {
		googleId: "123456",
		name: "Test Teacher",
		image: "http://findicons.com/files/icons/350/aqua_smiles/128/to_yawn.png",
		access_token: "Aajsdhfowers"
	}
}

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
	console.log("you are the zone: "+zone.id);
	teacher = getCurrentTeacher();
	console.log(teacher);
	data = {
		teacher_id: teacher,
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
	console.log("Removed from zone: "+zone.id);
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
