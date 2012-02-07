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
	console.log(event_url);
	$.ajax({
		url : event_url,
		type : "GET",
		dataType: "JSON",
		success: function(response) {
			console.log(response);
		}
	});
}
