// Requires
var _ = require('lodash');
var moment = require('moment');
var $ = require('jquery');
require('jquery.countdown');

// Utils, bound to correct values for event and transition length
var startTimes = _.partial( require('../../utils/StartTimes'), EVENT_LENGTH, TRANSITION_LENGTH);
var getCurrentEvent = _.partialRight( require('../../utils/GetCurrentEvent'), EVENT_LENGTH, TRANSITION_LENGTH );

// Renders the progress bar at the top of page, using the start time of the student's next (or current) event.
renderProgressBar = function(eventStart){

	$('.countDown').show();
	var currentTime = moment( Date.now() );

	if (eventStart && currentTime.isAfter( eventStart ) ) {
		return null;
	} else {
		$('.timer').countDown({
			start_time: currentTime, //Time when the progress bar is at 0%
			end_time: eventStart || currentTime.add(1, 'ms'), //Time Progress bar is at 100% and timer runs out, when no eventStart is passed for end_time, use current time with 1 added ms to trigger onComplete and update_progress
			progress: $('.progress-bar'), //There dom element which should display the progressbar.
			onComplete: function() {
				$('.timer').show();
				$('.timer').replaceWith("<div class=\"timer ended\">Time's Up!</div>");
			},
			update_progress : function(progress, element){
				if (Math.floor(progress) === 50) {
					$(element).removeClass('progress-bar-success').addClass('progress-bar-warning');
				} else if (Math.floor(progress) === 75) {
					$(element).removeClass('progress-bar-warning').addClass('progress-bar-danger');
				}

				element.attr('aria-valuenow', Math.floor(progress));//We set a custom attribute, 'area-valuenow' containing the progress
				element.css('width', Math.floor(progress)+'%');//Fill the bar with percentage of progress
				element.text(Math.floor(progress)+'%');//Put text notation of progress inside the progressbar
			}
		});
	}
}

/*
	Render the event data.

	Uses globals from the CONFIG to pair images with locations, activities, creators and focus areas.

	Parses the event based on what data is available.
*/
renderLocationImage = function(eventLocation, eventActivity, eventCreator, focusArea) {

	if (eventLocation) {
		$('#locationImage').empty().append( LOCATION_IMAGES[eventLocation.toLowerCase()] );
		$('#locationText').empty().append(eventLocation);
	}

	// Check if the event activity has an icon, otherwise it is a description and use GET_ACTIVITY
	if (eventActivity && ACTIVITY_IMAGES[eventActivity.toLowerCase()]) {
		$('#activityImage').empty().append( ACTIVITY_IMAGES[eventActivity.toLowerCase()] );
	} else {
		$('#activityImage').empty().append( GET_ACTIVITY(eventActivity) );
	}

	$('#activityText').empty().append(eventActivity || '');

	if (eventCreator) {
		$('#creatorImage').empty().append( CREATOR_IMAGES[eventCreator] );
	} else if (focusArea) {
		$('#creatorImage').empty().append( FOCUS_AREAS[focusArea] );
		$('#creatorText').empty().append(focusArea);
	}
}

/*
	Use the getCurrentEvent util to fetch a student's next / current event and display it. Using the same utility as server should ensure that the event being shown is always what will be validated against when a student scans in.
*/
function renderNextEvent(student) {
	var currentEvent = getCurrentEvent(student);

	/*
		If there is no current event, either we have no grove calendar, in which case we wait until that data is passed in, or the grove calendar needs to reset, in which case we show the first grove calendar event.
	*/
	if (!currentEvent && _.isEmpty(student.groveCalendar) ) {
		return null;
	} else if (!currentEvent && !_.isEmpty(student.groveCalendar) ) {
		currentEvent = student.groveCalendar[0];
	}

	// Set data on window so it can be accessed in console for debugging purposes
	window.eventData = currentEvent,
	window.userData = student;

	// Render the location image with the event data (some of which will not exist, depending on grove vs. google)
	renderLocationImage( currentEvent.location,currentEvent.activity || currentEvent.summary, currentEvent.creator, currentEvent.focus_area );
//renderLocationImage( currentEvent.location,currentEvent.summary, currentEvent.creator);
	// Render the prograss bar with the start time, which we get off a google event or using startTimes for grove calender events
	var start = moment( currentEvent.start ) || moment( Date.now() ).add( startTimes(), 'ms' );
	renderProgressBar( start );
}

/*
	Once the user is loaded via Oauth, grab their calendar using google calendar's API, then save it.
*/
getCalendar = function(userData){

	// Start and end times for calendar
	var start = moment( Date.now() ).startOf('day').toISOString();
	var end = moment( Date.now() ).endOf('day').toISOString();

	//get users google calendar events starting with today
	gapi.client.request('https://www.googleapis.com/calendar/v3/calendars/' + userData.email + '/events/?singleEvents=true&timeMin=' + start + '&timeMax=' + end + '&orderBy=startTime').execute(function(response) {

		// Parse response to put events in correct format and add that to the user data
		userData.calendar = _.map(response.items, function(event){
			return {
					eventId: event.id,
					location: event.location,
					creator: event.creator.displayName || event.creator.email,
					start: event.start.dateTime,
					end: event.end.dateTime,
					description: event.description,
					summary: event.summary

				};
		});

		/*
			Now that we have the student's calendar, we save it in case new events have been added.

			Before waiting for the save to process, we make an initial call to renderNextEvent without waiting for the student object (including grove calendar) to come back. This is to speed up rendering in case the next event is a google calendar event.
		*/
		$.ajax ({
			type: "POST",
			url: 'api/user',
			data: JSON.stringify(userData),
			contentType: 'application/json',
			success: renderNextEvent
		});

		renderNextEvent( userData );
	});
}

/* Callback on Oath complete. In global scope so gapi can access it. */
signinCallback = function(authResult) {
	if (authResult['status']['signed_in']) {

		// Update the app to reflect a signed in user
		// Hide the sign-in button now that the user is authorized, and show the container
		$('#signinButton').hide();
		$('#main-container').show()

		//make call to google profile for users account information
		gapi.client.request('https://www.googleapis.com/plus/v1/people/me?fields=name(familyName%2Cformatted%2CgivenName)%2CdisplayName%2Cemails%2Fvalue%2Cimage%2Furl%2Cid').execute(function(response) {

			var signInData = {
				id: response.id,
				name: response.displayName,
				email: response.emails[0].value,
				image: response.image.url
			}

			// Now that we have the ID of the student that signed in, listen for any scans from that student and close this window on scan
			var handleScan = function(scan) {
				if (scan.googleId === response.id) {
					window.close();
				}
			};

			var tracker = io.connect();
			tracker.on('SCAN!', handleScan);

			$('#name').append('<h2>' + response.displayName + '\'s Next Step</h2>');

			//add google id to scan href/link. that way when scan returns scanned_data we have the users id
			$('#scan-button').attr('href', 'scan://scan?callback=https%3A%2F%2Froots-elementary.herokuapp.com/scanredirect/'+response.id);

			//get calendar events on signIn and send events/user to database in function above
			$('.scan-button').show();
			getCalendar(signInData);
	});
	} else {
		// Update the app to reflect a signed out user
		// Possible error values:
		//   "user_signed_out" - User is signed-out
		//   "access_denied" - User denied access to your app
		//   "immediate_failed" - Could not automatically log in the user
		console.log('Sign-in state: ' + authResult['error']);
	}
}

teacherSigninCallback = function(authResult){
	if (authResult['status']['signed_in']) {
		$('#signinButton').hide();

		//make call to google profile for users account information
		gapi.client.request('https://www.googleapis.com/plus/v1/people/me?fields=name(familyName%2Cformatted%2CgivenName)%2CdisplayName%2Cemails%2Fvalue%2Cimage%2Furl%2Cid').execute(function(response) {

			var signInData = {
				id: response.id,
				name: response.displayName,
				// email: response.emails[0].value,
				image: response.image.url
			}
			teacherRedirect(signInData);
		});

	}
	else{
		console.log('Sign-in state: ' + authResult['error']);
	}
}

teacherRedirect = function(teacherData){
	$.ajax ({
			type: "POST",
			url: 'api/teacher',
			data: JSON.stringify(teacherData),
			contentType: 'application/json',
			success: function(){
				window.location.href = '/grove-overview';
			}
	});

}
