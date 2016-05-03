$(function() {
	var autocompleteCity;
	google.load("maps", "3.x", {
		callback: initialize,
		other_params: 'sensor=false&libraries=places'
	});

	function initialize() {
		var input = document.getElementById('id_location');
		var autocomplete = new google.maps.places.Autocomplete(input, {
			types: ['(cities)']
		});
		google.maps.event.addListener(autocomplete, 'place_changed', function() {
			var place = autocomplete.getPlace();
			if (!place.geometry) {
				console.log('no location');
				return;
			}
			autocompleteCity = place.formatted_address;
		});
	}

	function initMap(lat, lng) {
		// Create a map object and specify the DOM element for display.
		$('#map').addClass("thumbnail");
		var map = new google.maps.Map(document.getElementById('map'), {
			center: {
				lat: lat,
				lng: lng
			},
			scrollwheel: false,
			zoom: 9
		});
		var marker = new google.maps.Marker({
			position: {
				lat: lat,
				lng: lng
			},
			map: map,
		});
	}
	var url = "http://api.openweathermap.org/data/2.5/forecast?";
	var key = "&appid=c55ec823be46f88fbcf55db70cc8e772";
	$("#search-form").on("submit", function(e) {
		e.preventDefault();
		var query = $(this).serialize();
		$("input.search-term").val('');
		$.get(url + query + key, function(result) {
			var dataSeries = [];
			for (var i = 0; i < result.list.length; i += 8) {
				var dayData = result.list.slice(i, i + 8).map(function(data) {
					return Number((data.main.temp * 9 / 5 - 459.67).toFixed(2));
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
					categories: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"]
				},
				yAxis: {
					title: {
						text: 'Temperature (°C)'
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
			var city = autocompleteCity || result.city.name;
			$('#chart-wrapper').prepend("<h1 id='city' class='text-center'>" + city + "</h1>");
			initMap(result.city.coord.lat, result.city.coord.lon);
		});
	});
});