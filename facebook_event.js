var path = window.location.pathname.split("/");
var eventId = parseInt(path[path.length-2], 10);

if (window.location.hash.length === 0) {
	var appID = "125933790862204";
	var path = 'https://www.facebook.com/dialog/oauth?';
	var queryParams = ['client_id=' + appID,'redirect_uri=https://www.facebook.com/connect/login_success.html?event_id='+eventId, 'response_type=token', "scope=user_events"];
	var query = queryParams.join('&');
	var url = path + query;
	window.open(url);
} else {
	var accessToken = window.location.hash.substring(1);
	var eventId = window.location.search.split("=")[1];
	var path = "https://graph.facebook.com/"+eventId+"?";

	var queryParams = [accessToken];
	var query = queryParams.join('&');
	var event_url = path + query;
	$.ajax({
		url : event_url,
		type : "GET",
		dataType: "JSON",
		success: function(response) {
			var titleText = response.name;
			var descriptionText = response.description ? response.description.substring(0, 500) : "";
			var startTime = formatTime(response.start_time);
			var endTime = formatTime(response.end_time);
			var locationText = get_location(response).replace(/\n$/,'').replace(/\n/g,'');
			var href = 'https://www.google.com/calendar/render?action=TEMPLATE'
			+ '&text=' + encodeURIComponent(titleText)
			+ '&dates='+ startTime + '/' + endTime
			+ '&location=' + locationText
			+ '&details=' + encodeURIComponent(descriptionText)
			+ '&trp;=true&sprop=+website:http://www.facebook.com&sprop;=name:Jave+Cafe&gsessionid=OK&sf=true&output=xml';
			window.open(href);

		}
	});
}

function get_location(response) {
	var venue = response.venue;
	if (venue && venue.street) {
		return response.location + " " + venue.street + " " + venue.city + ", " + venue.state;
	} else {
		return "";
	}
}
function formatTime(dateTime) {
	var d = new XDate(new Date(dateTime)).addHours(8);
	var dStr = d.getUTCFullYear()
           + pad(d.getUTCMonth() + 1)
           + pad(d.getUTCDate())
           + 'T'
           + pad(d.getUTCHours())
           + pad(d.getUTCMinutes())
           + '00Z';

  return dStr;
}

function pad(str)
{
  str = str.toString();
  return (str.length == 1) ? '0' + str : str;
}
