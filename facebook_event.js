function checkURL() {
	var pathSplit = window.location.pathname.split("/");
	if (pathSplit.length > 3 && pathSplit[1] === "events") {
		if ($(".gcal_link").length === 0) {
			$(addAndBindLink); 
		}
	}
	delete pathSplit;
}

function addAndBindLink() {
	if ($(".gcal_link").length === 0) {
		// second check in case 
		$("<span />")
			.text("Add to Google Calendar")
			.addClass("gcal_link").addClass("facebook_event_to_gcal")
			.bind("click", openFacebook)
			.appendTo("#headerArea .fbEventHeaderBlock .mbm");
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
		success: function(response) {
			var titleText = response.name;
			var description = escape(response.description);
			var descriptionText = description ? description.substring(0, 1000) : "";
			descriptionText = unescape(descriptionText);
			descriptionText += "\n\nFacebook event URL is https://www.facebook.com/events/"+eventId;
			var startTime = formatTime(response.start_time);
			var endTime = formatTime(response.end_time);
			if (startTime === null) {
				$("<div />").addClass("invalid-date facebook_event_to_gcal").text("I'm sorry but the date on this event is invalid! Please try again");
				return;
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
			var href = "https://www.google.com/calendar/render?" + gCalParams;
			window.open(href, "_self");
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

	function pad(str) {
	  str = str.toString();
	  return (str.length == 1) ? '0' + str : str;
	}

	var d = new XDate(new Date(dateTime));
	if (d.valid()) {
		d.addHours(d.getTimezoneOffset()/60);
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