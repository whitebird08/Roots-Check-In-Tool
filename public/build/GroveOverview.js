webpackJsonp([1],{

/***/ 0:
/*!*************************************!*\
  !*** ./public/js/grove-overview.js ***!
  \*************************************/
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function($) {__webpack_require__(/*! jquery */ 90);
	__webpack_require__(/*! jquery-ui */ 105);
	var cookie = __webpack_require__(/*! cookie */ 106);
	
	
	// we may not need these parsing functions anymore:
	
	// function from scotch tutorial to parse cookie https://scotch.io/quick-tips/easily-create-read-and-erase-cookies-with-jquery
	// function readCookie(name) {
	//   var nameEQ = name + "=";
	//   var ca = document.cookie.split(';');
	//   for(var i=0;i < ca.length;i++) {
	//     var c = ca[i];
	//     while (c.charAt(0)==' ')
	//     c = c.substring(1,c.length);
	//     if (c.indexOf(nameEQ) == 0)
	//     return c.substring(nameEQ.length,c.length);
	//     }
	//   return null;
	// }
	//
	// function urlNameParse (str) {
	//   var newArr = str.split('')
	//   var mapArr = newArr.map(function(item) {
	//     if (item === "%" ) {
	//       return ""
	//     } else if (item === "2") {
	//       return ""
	//     } else if (item === "0")
	//       return " "
	//     else {
	//       return item
	//     }
	//   })
	//   return mapArr.join("")
	// }
	
	function getCurrentTeacher() {
	  var cookieObject = cookie.parse(document.cookie);
	  console.log(cookieObject.name);
	  console.log(cookieObject.image);
	  console.log(cookieObject.googleId);
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
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(/*! jquery */ 90)))

/***/ },

/***/ 106:
/*!***************************!*\
  !*** ./~/cookie/index.js ***!
  \***************************/
/***/ function(module, exports) {

	/*!
	 * cookie
	 * Copyright(c) 2012-2014 Roman Shtylman
	 * Copyright(c) 2015 Douglas Christopher Wilson
	 * MIT Licensed
	 */
	
	/**
	 * Module exports.
	 * @public
	 */
	
	exports.parse = parse;
	exports.serialize = serialize;
	
	/**
	 * Module variables.
	 * @private
	 */
	
	var decode = decodeURIComponent;
	var encode = encodeURIComponent;
	var pairSplitRegExp = /; */;
	
	/**
	 * RegExp to match field-content in RFC 7230 sec 3.2
	 *
	 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
	 * field-vchar   = VCHAR / obs-text
	 * obs-text      = %x80-FF
	 */
	
	var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
	
	/**
	 * Parse a cookie header.
	 *
	 * Parse the given cookie header string into an object
	 * The object has the various cookies as keys(names) => values
	 *
	 * @param {string} str
	 * @param {object} [options]
	 * @return {object}
	 * @public
	 */
	
	function parse(str, options) {
	  if (typeof str !== 'string') {
	    throw new TypeError('argument str must be a string');
	  }
	
	  var obj = {}
	  var opt = options || {};
	  var pairs = str.split(pairSplitRegExp);
	  var dec = opt.decode || decode;
	
	  pairs.forEach(function(pair) {
	    var eq_idx = pair.indexOf('=')
	
	    // skip things that don't look like key=value
	    if (eq_idx < 0) {
	      return;
	    }
	
	    var key = pair.substr(0, eq_idx).trim()
	    var val = pair.substr(++eq_idx, pair.length).trim();
	
	    // quoted values
	    if ('"' == val[0]) {
	      val = val.slice(1, -1);
	    }
	
	    // only assign once
	    if (undefined == obj[key]) {
	      obj[key] = tryDecode(val, dec);
	    }
	  });
	
	  return obj;
	}
	
	/**
	 * Serialize data into a cookie header.
	 *
	 * Serialize the a name value pair into a cookie string suitable for
	 * http headers. An optional options object specified cookie parameters.
	 *
	 * serialize('foo', 'bar', { httpOnly: true })
	 *   => "foo=bar; httpOnly"
	 *
	 * @param {string} name
	 * @param {string} val
	 * @param {object} [options]
	 * @return {string}
	 * @public
	 */
	
	function serialize(name, val, options) {
	  var opt = options || {};
	  var enc = opt.encode || encode;
	
	  if (!fieldContentRegExp.test(name)) {
	    throw new TypeError('argument name is invalid');
	  }
	
	  var value = enc(val);
	
	  if (value && !fieldContentRegExp.test(value)) {
	    throw new TypeError('argument val is invalid');
	  }
	
	  var pairs = [name + '=' + value];
	
	  if (null != opt.maxAge) {
	    var maxAge = opt.maxAge - 0;
	    if (isNaN(maxAge)) throw new Error('maxAge should be a Number');
	    pairs.push('Max-Age=' + Math.floor(maxAge));
	  }
	
	  if (opt.domain) {
	    if (!fieldContentRegExp.test(opt.domain)) {
	      throw new TypeError('option domain is invalid');
	    }
	
	    pairs.push('Domain=' + opt.domain);
	  }
	
	  if (opt.path) {
	    if (!fieldContentRegExp.test(opt.path)) {
	      throw new TypeError('option path is invalid');
	    }
	
	    pairs.push('Path=' + opt.path);
	  }
	
	  if (opt.expires) pairs.push('Expires=' + opt.expires.toUTCString());
	  if (opt.httpOnly) pairs.push('HttpOnly');
	  if (opt.secure) pairs.push('Secure');
	  if (opt.firstPartyOnly) pairs.push('First-Party-Only');
	
	  return pairs.join('; ');
	}
	
	/**
	 * Try decoding a string using a decoding function.
	 *
	 * @param {string} str
	 * @param {function} decode
	 * @private
	 */
	
	function tryDecode(str, decode) {
	  try {
	    return decode(str);
	  } catch (e) {
	    return str;
	  }
	}


/***/ }

});
//# sourceMappingURL=GroveOverview.js.map