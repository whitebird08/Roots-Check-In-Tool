renderProgressBar = function(eventStart){
  var currentTime = moment().format();

  $('.timer').countdown({  
    start_time: currentTime, //Time when the progress bar is at 0%
      end_time: eventStart, //Time Progress bar is at 100% and timer runs out
      progress: $('.progress-bar'), //There dom element which should display the progressbar.
      onComplete: function() {
            $('.timer').show();
                  $('.timer').replaceWith("<div class=\"timer ended\">Time's Up!</div>");
      }    
  });
}

renderLocationImage = function(eventLocation, eventCreator) {

  if (eventLocation == 'Library'){
    var libraryImg = $("<img src='/img/blue-triangle.png' width='70px'>")
    var pencilImg = $("<i class='fa fa-pencil fa-4x'>")

    $('.locationImage').append(libraryImg);
    $('.locationText').append('Library');

    $('.activityImage').append(pencilImg);
    $('.activityText').append('Writing');
  }

  if (eventCreator == 'team@rootselementary.org') {
    $('.creatorImage').append("<img src='/img/jill-image.jpg' width='70px'>");
    $('.creatorText').append('Jill Carty')
  }

}


function getCalendar(userData){
  gapi.client.request('https://www.googleapis.com/calendar/v3/calendars/' + userData.email + '/events/').execute(function(response) {

        var currentTime = moment().format()

        var events = _.map(response.items, function(event){

          return {
              eventId: event.id,
              location: event.location,
              creator: event.creator.email,
              start: event.start.dateTime,
              end: event.end.dateTime,
              description: event.description
            }
        });

        userData.calendar = events;

        var dataString = JSON.stringify(userData);

        console.log(dataString)

        // $.post('api/saveUser', dataString, function(result){
        //   console.log('responseData', result);
        // });

        $.ajax ({
          type: "POST",
          url: 'api/saveUser',
          data: dataString,
          dataType: 'JSON',
          success: function(err, results){
            console.log(results)
          }
        });

        var nextEvent = _.find(response.items, function(event){
          var a = moment(currentTime);
          var b = moment(event.start.dateTime);
          var difference = b.diff(a, 'minutes');
          return (difference <= 10 && difference > 0)
        });

        if (nextEvent) {
          $('#event').prepend($('<h3>' + nextEvent.location + '</h3>'));

          renderProgressBar(nextEvent.start);
          renderLocationImage(nextEvent.location, nextEvent.creator);
        }
  });
}


function signinCallback(authResult) {
  if (authResult['status']['signed_in']) {
    // Update the app to reflect a signed in user
    // Hide the sign-in button now that the user is authorized, for example:
    document.getElementById('signinButton').setAttribute('style', 'display: none');

    gapi.client.request('https://www.googleapis.com/plus/v1/people/me?fields=name(familyName%2Cformatted%2CgivenName)%2CdisplayName%2Cemails%2Fvalue%2Cimage%2Furl%2Cid').execute(function(response) {

      var signInData = {
        id: response.id,
        name: response.displayName,
        email: response.emails[0].value,
        image: response.image.url
      }

      getCalendar(signInData)
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