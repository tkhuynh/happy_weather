$(function() {
	console.log($("#map").offset())
	var cityName;
	$.getJSON('http://ipinfo.io', function(data){
		var templateData = {};
		cityName = data.city + ", " + data.region;
		var lat = data.loc.split(",")[0];
		var lon = data.loc.split(",")[1];
  	var query = "lat=" + lat + "&lon=" + lon;
  	$.get(url + "forecast?" + query + unit + key, forecast);
		$.get(url + "weather?" + query + unit + key, currentWeather);
	});
	// auto compelte for city
	google.load("maps", "3.x", {
		callback: initialize,
		other_params: 'sensor=false&libraries=places'
	});

	var url = "http://api.openweathermap.org/data/2.5/";
	var unit = "&units=imperial";
	var key = "&appid=c55ec823be46f88fbcf55db70cc8e772";
	$("#search-form").on("submit", function(e) {
		cityName = titleize($(this).find("#id_location").val());
		var templateData = {};
		e.preventDefault();
		var query = $(this).serialize();
		$("input#id_location").val('');
		$.get(url + "forecast?" + query + unit + key, forecast);
		$.get(url + "weather?" + query + unit + key, currentWeather);
	});

	function initialize() {
		var input = document.getElementById('id_location');
		var autocomplete = new google.maps.places.Autocomplete(input, {
			types: ['(cities)']
		});
	}

	// init map function
	function initMap(lat, lng) {
		// Create a map object and specify the DOM element for display.
		$('#map').addClass("thumbnail");
		var map = new google.maps.Map(document.getElementById('map'), {
			center: {
				lat: lat,
				lng: lng
			},
			scrollwheel: false,
			zoom: 12
		});
		var marker = new google.maps.Marker({
			position: {
				lat: lat,
				lng: lng
			},
			map: map,
		});
	}

	function titleize(str) {
		return str.replace(/\w\S*/g, function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1);
		});
	}

	// forecast
	function forecast(result) {
		initMap(result.city.coord.lat, result.city.coord.lon);
		var dataSeries = [];
		for (var i = 0; i < result.list.length; i += 8) {
			var dayData = result.list.slice(i, i + 8).map(function(data) {
				return data.main.temp;
			});
			var day = result.list[i].dt_txt.slice(0, 10);
			dataSeries.push({
				name: day,
				data: dayData
			});
		}
		$('#city').text("Welcome to, " + result.city.name);
		$('#chart-wrapper').highcharts({
			title: {
				text: "Next Five Day Temperature Forecast",
				x: -20 //center
			},
			subtitle: {
				text: "From " + dataSeries[0].name + " to " + dataSeries[4].name,
				x: -20
			},
			xAxis: {
				title: {
					text: 'Time of the Day'
				},
				categories: ["12AM", "3 AM", "6 AM", "9 AM", "12 PM", "3 PM", "6 PM", "9 PM"]
			},
			yAxis: {
				title: {
					text: 'Temperature (°F)'
				},
				plotLines: [{
					value: 0,
					width: 1,
					color: '#808080'
				}]
			},
			tooltip: {
				valueSuffix: '°C'
			},
			legend: {
				layout: 'vertical',
				align: 'right',
				verticalAlign: 'middle',
				borderWidth: 0
			},
			data: {
				table: 'datatable'
			},
			series: dataSeries
		});
	}
	// current weather
	function currentWeather(currentData) {
		templateData = {
			city_name: cityName,
			weather_description: titleize(currentData.weather[0].description),
			cloud_icon_url: "http://openweathermap.org/img/w/" + currentData.weather[0].icon + ".png",
			temp_icon_url: "images/temperature.png",
			humidity_icon_url: "images/humidity.png",
			wind_icon_url: "images/wind.png",
			temp: Math.round(currentData.main.temp),
			humidity: currentData.main.humidity,
			clouds: currentData.clouds.all,
			wind: currentData.wind.speed
		};
		// mustache
		var template = $('#template').html();
		Mustache.parse(template); // optional, speeds up future uses
		var rendered = Mustache.render(template, {
			currentData: templateData
		});
		$('#target').html(rendered);		
	}
});