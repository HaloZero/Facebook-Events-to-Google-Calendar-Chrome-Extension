function checkURL() {
	var pathSplit = window.location.pathname.split("/");
	if (pathSplit.length > 3 && pathSplit[1] === "events") {
		if ($(".gcal_link").length === 0) {
			addAndBindLink();
		}
	}
	delete pathSplit;
}

function addAndBindLink() {
	if ($(".gcal_link").length === 0) {
		// second check in case
		$span = $("<span />")
			.text("Add to Google Calendar")
			.addClass("gcal_link").addClass("facebook_event_to_gcal")
			.bind("click", openFacebook);
		// old event page as of 3/16/2014
		if ($(".fbEventHeaderBlock span.fcg").length > 0) {
			$span.appendTo($(".fbEventHeaderBlock span.fcg"));
		}

		// new event page as of 3/16/2014
		if ($("#event_featuring_line").length > 0) {
			$span.appendTo($("#event_featuring_line"));
		}
	}

}

function openFacebook() {
	var path = window.location.pathname.split("/");
	var eventId = parseInt(path[path.length-2], 10);
	var path = 'https://www.facebook.com/dialog/oauth?';
	var redirectURL = "https://www.facebook.com/connect/login_success.html?"+$.param({"event_id" : eventId});
	var query = $.param({"client_id" : '125933790862204', "redirect_uri" : redirectURL, "response_type" : 'token', 'scope' : 'user_events'})
	var url = path + query;
	window.open(url);
}

function loadGoogleCalendar() {
	var accessToken = window.location.hash.substring(1);
	var eventId = window.location.search.split("=")[1];
	var path = "https://graph.facebook.com/"+eventId+"?";
	var event_url = path + accessToken;
	$.ajax({
		url : event_url,
		type : "GET",
		dataType: "JSON",
		tryCount : 0,
    	retryLimit : 3,
		success: function(response) {
			var titleText = response.name;
			var description = escape(response.description);
			var descriptionText = description ? description.substring(0, 1000) : "";
			descriptionText = unescape(descriptionText);
			descriptionText += "\n\nFacebook event URL is https://www.facebook.com/events/"+eventId;

			// as of 2014-02-14, facebook is returning start_time and end_time encoded with a specific time zone
			var startTime = formatTime(response.start_time);
			var endTime = formatTime(response.end_time);
			if (startTime === null) {
				$("<div />").addClass("invalid-date facebook_event_to_gcal").text("I'm sorry but the date on this event is invalid! Please try again");
				return;
			}
			if (endTime == null) {
				var fakeEnd = new XDate(new Date(response.start_time));
				fakeEnd.addHours(3);
				endTime = formatTime(fakeEnd);
			}
			var locationText = get_location(response).replace(/\n$/,'').replace(/\n/g,'');
			var gCalParams = $.param({
				"action" : 'TEMPLATE',
				"text" : titleText,
				"dates" : startTime + '/' + endTime,
				"location" : locationText,
				"details" : descriptionText,
				"trp;" : true,
				'gsessionid' : 'OK',
				'output' : 'xml'
			});
			var href = "https://calendar.google.com/calendar/render?" + gCalParams;
			$("body").append($("<div>").text("Trying to load google calendar url now"));
			setTimeout(function() {
				window.open(href, "_self");
			}, 700);
		},
		error: function(error, jqxhr, settings, thrownError ) {
			$("body").append($("<div>").text("Information request failed. Trying again"));
			this.tryCount += 1;
			if (this.tryCount <= this.retryLimit) {
				$.ajax(this);
                return;
			} else {
				$("body").append($("<div>").text("Tried 3 times, failed. Please go back to Facebook and try again"));
			}
		}
	});
}

function get_location(response) {
	var result = "";
	var venue = response.venue;
	if (venue && (venue.street || venue.name)) {
		result = locationTextString(response.location, venue.street, venue.city, venue.state, venue.zip);
	} else if (venue && venue.id) {
		var accessToken = window.location.hash.substring(1);
		var path = "https://graph.facebook.com/"+venue.id+"?";
		var venue_url = path + accessToken;
		$.ajax({
			url: venue_url,
			async: false,
			type : "GET",
			dataType: "JSON",
			success: function(response) {
				var venue = response.location;
				result = locationTextString(response.name, venue.street, venue.city, venue.state, venue.zip);
			}
		});
	}
	return result || "Unknown Location";
}

function locationTextString(name, street, city, state, zip) {
	var result = name + ", ";
	result = street ? result + " " + $.trim(street) : result;
	result = city ? result + ", " + $.trim(city) : result;
	result = state ? result + " " + $.trim(state) : result;
	result = zip ? result + " " + $.trim(zip) : result;
	return result;
}

function formatTime(dateTime) {
	var d = new XDate(new Date(dateTime));
	return convertDateToString(d);
}

// @params [XDate]
function convertDateToString(d) {
	function pad(str) {
	  str = str.toString();
	  return (str.length == 1) ? '0' + str : str;
	}

	if (d.valid()) {
		// TODO: facebook is no longer returning timezones correctly?
		// d.addHours(d.getTimezoneOffset()/60);
		var dStr = d.getUTCFullYear()
	           + pad(d.getUTCMonth() + 1)
	           + pad(d.getUTCDate())
	           + 'T'
	           + pad(d.getUTCHours())
	           + pad(d.getUTCMinutes())
	           + '00Z';
		return dStr;
	} else {
		return null;
	}
}


if (window.location.hash.length > 0 && window.location.pathname.match("connect/login_success")) {
	try {
		loadGoogleCalendar();
	} catch(e) {
		$("<div />").text("See that success in the top left? That's a lie. Don't worry, I'm not lying to you. Facebook is. You have an error. Remember your event should have a start & end date, also facebook sometimes is slow and recently modified events sometimes aren't in their API yet. Just try again later. Sorry! You still getting this message after a week? Talk to me, shoot me an email at rohan.dhaimade@gmail.com and I'll see what I can do. Or send presents. Whatever. ").css("font-size", "25px").css("font-weight", "bold").appendTo("body");
	}
}

// Since facebook uses the history API, I have to check for facebook event URLs
setInterval(checkURL, 1000);