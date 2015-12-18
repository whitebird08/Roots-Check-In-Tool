webpackJsonp([3],[
/* 0 */
/*!********************************!*\
  !*** ./public/js/lost-kids.js ***!
  \********************************/
/***/ function(module, exports, __webpack_require__) {

	// Requires
	var _      = __webpack_require__(/*! lodash */ 1);
	var moment = __webpack_require__(/*! moment */ 3);
	var $      = __webpack_require__(/*! jquery */ 90);
	
	// Utils, bound to correct values for event and transition length
	var startTimes = _.partial( __webpack_require__(/*! ../../utils/StartTimes */ 107), EVENT_LENGTH, TRANSITION_LENGTH);
	
	/* 
		Sorts first by status, showing students that are in the correct center first, and then sorts by first name alphabetically.
		@params: Takes in two jQuery objects for use with jQuery's sort
	*/
	function sortByNameAndStatus(a, b) {
		var an = $(a).attr('data-name'), bn = $(b).attr('data-name');
	
		return $(b).hasClass('Found') - $(a).hasClass('Found') || (an > bn) - 1 || 1; 
	};
	
	/* 
		Put in a slight delay for student panels to display, then set them all to same height (Not currently using this implementation, but keeping it in case we want to switch back)
	*/
	function resizeDisplays() {
		window.setTimeout(function(){
			var displays = $('.studentLocationDisplay');
	
			var heights = displays.map(function() {
				return $(this).height()
			});
	
			var maxHeight = Math.max.apply(null, heights);
	
			displays.height(maxHeight);
		}, 500);
	}
	
	/*
		Create a nice display out of a string by uppercasing each first letter
	*/
	function upperCaseFirst(string) {
		return string.split(' ').map( function(word) {
			return word[0].toUpperCase() + word.slice(1);
		}).join(' ');
	}
	
	/* 
		Creates the display for a student.
		Have this as a general method instead of on the prototype because it is only called once.
	
		@params student: the data for a student (NOTE: this is NOT the class instance, we must bind it for the click handler to properly attach)
	*/
	function createStudentDisplay(student) {
		// Create the DOM element representing the student
		var display = $('<div>')
			.addClass('studentLocationDisplay')
			.addClass('col-md-2')
			.attr('id', student.googleId)
			.attr('data-name', student.name);
	
		var container = $('<div>').addClass('nameImageContainer');
	
		var absentToggle = $('<button>')
			.addClass('btn btn-xs btn-primary absent-toggle')
			.text( student.absent ? 'Present' : 'Absent');
	
		var toggle = $('<div>').append(absentToggle);
		var info   = $('<div>').addClass('studentInfoContainer')
		var name   = $('<div>').addClass('name').text( student.name );
		var img    = $('<div>').append( $('<img>').addClass('studentImage').attr('src', student.image) );
	
		container.append( name ).append( img );
	
		display.append( container ).append( info ).append( toggle );
		
		absentToggle.on('click', this.toggleAbsent.bind(this));
	
		return display;
	}
	
	// Globals
	var studentsArray = [];
	var FILTER = 'All';
	
	// Class of student display
	var StudentLocationDisplay = function(student) {
		this.data = _.pick(student, ['_id', 'email','name','image','googleId', 'absent']);
	
		this.el = createStudentDisplay.call(this, student);
	
		// If student is absent, no need to mess with any of the below data
		if (student.absent) {
			this.status = 'Absent';
			this.updateDisplay();
		}
		// Look at the student's recent scan to determine if they are in the correct place or not
		else if (student.recentScan) {
			scan = student.recentScan;
			
			// First, check if the scan is recent (i.e. if that event is still ongoing)
			var recent = false;
			var event = scan.event[0];
	
			// If google event, check against event end
			if (event && event.end && moment(event.end).subtract(TRANSITION_LENGTH, 'ms').isAfter( Date.now() ) ) {
				recent = true;
			}
			// If grove calendar, check against length of events
			else if (event && !event.end && moment(scan.time).add(EVENT_LENGTH- TRANSITION_LENGTH, 'ms').isAfter( Date.now() ) ) {
				recent = true;
			}
	
			// If the scan is recent
			if (recent) {
				this.recentScan = scan;
				this.onScan(scan);
			} 
			// If the scan is not recent, student is lost
			else {
				this.status = 'Lost';
				this.updateDisplay();
			}
		} 
		// If there is no recent scan at all, student is lost
		else {
			this.status = 'Lost';
			this.updateDisplay();
		}
	
	};
	
	// Toggles absent / present status
	StudentLocationDisplay.prototype.toggleAbsent = function(e) {
		e.preventDefault();
	
		this.status = this.status === 'Absent' ? 'Lost' : 'Absent';
	
		var self = this;
	
		$.post( '/api/user/', { id: this.data.googleId, absent: !this.data.absent }, self.updateDisplay.bind(self) );
	}
	
	/*
		Updates the student's display
		1. Check if they are absent or not
		2. Update their classes and explanation text
		3. If they are lost, we need to get their current event and display that as a correction, in addition to their recent scan, if any.
	*/ 
	StudentLocationDisplay.prototype.updateDisplay = function() {
	
		if (this.status != 'Absent') {
			this.el.find('.absent-toggle').text('Absent');
		}
	
		if (this.status === 'Found') {
			var scannedEvent = this.recentScan.event[0];
			var text = _.chain(['summary', 'activity', 'focus_area'])
				.map(function(key) {
					return scannedEvent[key];
				})
				.filter()
				.join(' | ')
				.value()
	
			var info = $('<p>').addClass('last-scan-info').addClass('text-primary').text(text);
	
			this.el.find('.studentInfoContainer').empty().append(info);
			this.el.removeClass('Lost').addClass('Found');
			this.render();
		}
		else if (this.status === 'Lost') {
			var self = this;
	
			// Call the API endpoint to get current event without a scan
			$.get('/current-event/' + this.data.googleId, function(result) {
	
				self.el.removeClass('Found').addClass('Lost');
				
				var info = self.el.find('.studentInfoContainer');
				info.empty()
	
				// Show correct location
				$('<p>').addClass('correct-location-info text-primary')
					.text(result.location)
					.appendTo( info );
	
				// If there is a recent scan, show where the student is based on that scan
				if (self.recentScan) {
					$('<p>').addClass('last-scan-info text-danger')
						.text(self.recentScan.scannedLocation)
						.appendTo( self.el.find('.studentInfoContainer') );
				}
	
				// Move location based on result
				self.currentLocation = result.location;
				
				self.render()
			});
		} else if (this.status === 'Absent') {
			this.el.removeClass('Found').addClass('Lost');
			this.currentLocation = 'Absent';
			this.el.find('.absent-toggle').text('Present');
			this.render()
		}
	};
	
	/*
		Remove the student from their container and move to another, sorting the new container as needed.
	*/
	StudentLocationDisplay.prototype.render = function() {
		// Remove if already in DOM
		if (this.el) {
			this.el.remove();
		};
	
		// Render into the dom based on where their location is
		var location = $('#' + this.currentLocation.replace(/ /g, '') )
		location.append(this.el);
	
		/*
			If we want to put students into a lost container as well as their own, this would be the start... but many issues to deal with, including:
			1. The absent button event handler, properly binding to the student
			2. Removing the clone as well as the el above
			3. Making sure multiple copies don't show up
			
			if (this.status = 'Lost') {
				$('#Lost').append( this.el.clone(true) );
			}
		*/
	
		var locationArray = location.find('.studentLocationDisplay').sort( sortByNameAndStatus );
	
		locationArray.detach().appendTo( location );
	
		// Re-attach the absent click handler
		this.el.find('.absent-toggle')
			.off('click')
			.on('click', this.toggleAbsent.bind(this) );
	};
	
	/*
		onScan will either be called based on a scan being received or if a student is automatically checked out based on the event being over.
		1. Update their current location if there was a scan.
		2. Update their status based on whether the scan was correct or not.
		3. If there was a correct scan, set up a new timer.
		4. Call updateDisplay
	*/
	StudentLocationDisplay.prototype.onScan = function(scan) {
	
		var self = this;
	
		if (scan && scan.correct) {
			this.currentLocation = scan.scannedLocation;
			this.status = 'Found';
	
			// Get time until the event is over, either based on the event's end for google calendar events or the startTimes util for grove calendar events
			var difference = scan.event[0].end ? moment(scan.event[0].end).subtract( TRANSITION_LENGTH, 'ms').diff( Date.now() ) : startTimes() + EVENT_LENGTH - TRANSITION_LENGTH;
			
			this.transitionTimeout = window.setTimeout( self.onScan.bind(self, null), difference);
		}
		// If the scan does not match the location, the student is lost
		else if (scan) {
			this.status = 'Lost';
		}
		// If there is no scan, the student is lost, and remove their recent scan
		else {
			this.status = 'Lost';
			this.recentScan = null;
		}
	
		// Now updateDisplay
		self.updateDisplay();
	};
	
	// When receiving a scan, find the student that matches the scan, move them to a new location based on the scan and clear any possible transitions
	function scanReceived(scan) {
	
		var scanStudent = _.find(studentsArray, function(student) {
			return student.data.googleId === scan.googleId;
		});
	
		// If a student is found, move the student and override their recent scan
		if (scanStudent) {
			if (scanStudent.transitionTimeout) { window.clearTimeout(scanStudent.transitionTimeout); }
			scanStudent.recentScan = scan;
			// Call the onScan function, making sure it is bound to the current student
			scanStudent.onScan.call(scanStudent, scan);
		}
	}
	
	/*
		On page load:
		1. Create filter buttons and container divs for all the different possible locations, and an extra one for 'Absent'.
		2. Load all students using an AJAX call, make StudentLocationDisplay instances for each. Initiating the instance will also move the student to their initial location.
	*/
	$(function(){
		['Lost'].concat(_.keys(LOCATION_IMAGES ), 'Absent').forEach( function(location) {
			
			// Display, with special protection for iPad Center
			var prettyDisplay = location.match(/ipad/i) ? 'iPad Center' : upperCaseFirst(location);
	
			// Create the filter button and add it to button group
			var button = $('<button>').addClass('btn btn-info btn-block').text(prettyDisplay);
			var listItem = $('<li>').append(button);
			$('#location-filters').append(listItem);
	
			// Create the container
			$('<div>')
				.addClass('row')
				.attr( 'id', prettyDisplay.replace(/ /g, '') )
				.append( $('<h3>').text(prettyDisplay) )
				.appendTo( $('#locations-container') );
		});
	
		// Attach event handler to the filter buttons
		$('#location-filters button').click(function(e) {
			
			// Set filter
			FILTER = $(this).text();
	
			// Update display, either showing all or hiding all except the one clicked
			if (FILTER === 'All') {
				$('#locations-container > div').show();
			}
			else {
				$('#locations-container > div').hide();
				$('#' + FILTER.replace(/ /g, '') ).show();
			}
	
			// Update the display of the filter buttons by removing primary from all and adding it to this one
			$('#location-filters button.btn-warning')
				.removeClass('btn-warning')
				.addClass('btn-info');
			$(this)
				.removeClass('btn-info')
				.addClass('btn-warning');
		});
		
		// Once all the containers are set, make AJAX call to get all the students and create StudentLocationDisplay objects
		$.get('api/user', function(students) {
			studentsArray = _.map(students, function(student) {
				return new StudentLocationDisplay(student);
			});
		});
	
		// Listen for scans
		var tracker = io.connect();
		tracker.on('SCAN!', scanReceived );
	
		// All absent event handler
		$('.all-absent').on('click', function() {
			$.ajax('/api/user/bulk', { 
				type: 'PUT',
				contentType: 'application/json',
				data: JSON.stringify({ absent: true })
			});
		});
		
	});


/***/ }
]);
//# sourceMappingURL=StudentTracker.js.map