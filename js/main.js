$(function() {
	// flash message disappear
	$("#current-location-msg").fadeTo(5000, 800).fadeOut(800, function() {
		$(this).alert('close');
	});
	// set clock
	startTime();

	var template = $('#template').html();
	// OpenWeatherMap
	var url = "http://api.openweathermap.org/data/2.5/";
	var unit = "&units=imperial";
	var key = "&appid=c55ec823be46f88fbcf55db70cc8e772";
	var cityName;
	$.getJSON('http://ipinfo.io', function(data) {
		var lat = data.loc.split(",")[0];
		var lon = data.loc.split(",")[1];
		var query = "lat=" + lat + "&lon=" + lon;
		$.get(url + "forecast?" + query + unit + key, forecast);
		$.get(url + "weather?" + query + unit + key, currentWeather);
		$.get(url + "forecast/daily?" + query + unit + "&cnt=14" + key, nextFourTeen);
	});

	// auto compelte for city
	google.load("maps", "3.x", {
		callback: initialize,
		other_params: 'sensor=false&libraries=places'
	});
	$("#search-form").on("submit", function(e) {
		cityName = titleize($(this).find("#id_location").val());
		console.log(cityName);
		e.preventDefault();
		var query = $(this).serialize();
		$("input#id_location").val('');
		$.get(url + "forecast?" + query + unit + key, forecast);
		$.get(url + "weather?" + query + unit + key, currentWeather);
		$.get(url + "forecast/daily?" + query + unit + "&cnt=14" + key, nextFourTeen);
	});

	function initialize() {
		var input = document.getElementById('id_location');
		var autocomplete = new google.maps.places.Autocomplete(input, {
			types: ['(cities)']
		});
	}

	// init map function
	function initMap(lat, lng, icon_url) {
		// Create a map object and specify the DOM element for display.
		$('#map').addClass("thumbnail");
		var map = new google.maps.Map(document.getElementById('map'), {
			center: {
				lat: lat,
				lng: lng
			},
			scrollwheel: false,
			zoom: 12,
			draggable: false
		});
		var marker = new google.maps.Marker({
			position: {
				lat: lat,
				lng: lng
			},
			map: map,
			icon: icon_url
		});
	}

	function titleize(str) {
		return str.replace(/\w\S*/g, function(txt) {
			return txt.charAt(0).toUpperCase() + txt.substr(1);
		});
	}

	// forecast
	function forecast(result) {
		var dataSeries = [];
		for (var i = 0; i < result.list.length; i += 8) {
			var dayData = result.list.slice(i, i + 8).map(function(data) {
				return data.main.temp;
			});
			var day = strftime('%a %m/%d', new Date(result.list[i].dt_txt.slice(0, 10)));
			dataSeries.push({
				name: day,
				data: dayData
			});
		}
		$('#city').text("Welcome to, " + result.city.name);
		$('#chart-wrapper').highcharts({
			title: {
				text: "Next Five Days's Temperature Forecast",
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
				valueSuffix: '°F'
			},
			legend: {
				layout: 'vertical',
				align: 'center',
				verticalAlign: 'bottom',
				borderWidth: 0
			},
			data: {
				table: 'datatable'
			},
			series: dataSeries
		});
	}

	// 2 week forecast for temprature
	function nextFourTeen(result) {
		var seriesTempData = [],
			drilldownTempData = [],
			windHumidityCategories = [],
			humidityData = [],
			windData = [];
		result.list.forEach(function(data) {
			windHumidityCategories.push(strftime('%a %m/%d', new Date(data.dt * 1000)));
			humidityData.push(data.humidity);
			windData.push(data.speed);
			seriesTempData.push({
				name: strftime('%a %m/%d', new Date(data.dt * 1000)),
				y: Math.round(data.temp.day),
				drilldown: strftime('%a %m/%d', new Date(data.dt * 1000))
			});

			drilldownTempData.push({
				name: strftime('%a %m/%d', new Date(data.dt * 1000)),
				id: strftime('%a %m/%d', new Date(data.dt * 1000)),
				data: [
					["Morning", Math.round(data.temp.morn)],
					["Day", Math.round(data.temp.day)],
					["Evening", Math.round(data.temp.eve)],
					["Night", Math.round(data.temp.night)],
					["Low", Math.round(data.temp.min)],
					["High", Math.round(data.temp.max)]
				]
			});
		});

		$('#next-fourteen-chart').highcharts({
			chart: {
				type: 'column'
			},
			title: {
				text: 'Two Week Temperature Forecast'
			},
			subtitle: {
				text: 'Click the columns to view details<br>Source: <a href="http://openweathermap.org">OpenWeatherMap</a>.'
			},
			xAxis: {
				type: 'category'
			},
			yAxis: {
				title: {
					text: 'Temperature (°F)'
				}

			},
			legend: {
				enabled: false
			},
			plotOptions: {
				series: {
					borderWidth: 0,
					dataLabels: {
						enabled: true,
						format: '{y} °F'
					}
				}
			},

			tooltip: {
				headerFormat: '<span style="font-size:11px">Day Temperature</span><br>',
				pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y} °F<br/>'
			},

			series: [{
				name: 'Brands',
				colorByPoint: true,

				data: seriesTempData
			}],
			drilldown: {
				series: drilldownTempData
			}
		});

		$('#wind-humidity').highcharts({
			chart: {
				zoomType: 'xy'
			},
			title: {
				text: 'Two Week Wind and Humidity Forecast'
			},
			subtitle: {
				text: 'Source: <a href="http://openweathermap.org">OpenWeatherMap</a>'
			},
			xAxis: [{
				categories: windHumidityCategories,
				crosshair: true
			}],
			yAxis: [{ // Primary yAxis
				labels: {
					format: '{value}%',
					style: {
						color: "#E78D1D"
					}
				},
				title: {
					text: 'Humidity',
					style: {
						color: "#E78D1D"
					}
				}
			}, { // Secondary yAxis
				title: {
					text: 'Wind',
					style: {
						color: "#689bff"
					}
				},
				labels: {
					format: '{value} mph',
					style: {
						color: "#689bff"
					}
				},
				opposite: true
			}],
			tooltip: {
				shared: true
			},
			legend: {
				layout: 'vertical',
				align: 'center',
				verticalAlign: 'bottom',
				backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
			},
			series: [{
				name: 'Wind',
				type: 'column',
				color: "#689bff",
				yAxis: 1,
				data: windData,
				tooltip: {
					valueSuffix: ' mph'
				}

			}, {
				name: 'Humidity',
				type: 'spline',
				color: "#E78D1D",
				data: humidityData,
				tooltip: {
					valueSuffix: '%'
				}
			}]
		});
		var lat = result.city.coord.lat;
		var lng = result.city.coord.lon;
		$("#restaurants-map").addClass("thumbnail");
		var map = new google.maps.Map(document.getElementById('restaurants-map'), {
			center: {
				lat: lat,
				lng: lng
			},
			scrollwheel: false,
			zoom: 14,
			draggable: false
		});
		$.get("https://api.foursquare.com/v2/venues/search?client_id=JRAIR0U0EJF0MRS02CHQ1BIQZ2UGAKHJUTNDYMYL11L3E4O0&client_secret=UYZH52YG3KBL0PR0YU55BML5LLVUTP2YOI2YKXFT2KWXAUJY&v=20130815&ll=" + lat + "," + lng + "&query=restaurant&radius=2000", function(fourSquare) {
			console.log(fourSquare.response.venues);
			var venues = fourSquare.response.venues;
			var infowindow = new google.maps.InfoWindow();
			var bounds = new google.maps.LatLngBounds();
			venues.forEach(function(venue) {
				var phone = venue.contact.formattedPhone || "<i>not listed</i>";
				var contentString = '<div class="windowContent">' +
					'<div id="siteNotice">' +
					'</div>' +
					'<h5 id="firstHeading" class="firstHeading">' + venue.name + '</h5>' +
					'<p><i>' + venue.categories[0].name + '</i></p>' +
					'<p>' + venue.location.address + ', ' + venue.location.city +
					'<br>Phone: ' + phone + '</p>' +
					'</div>';

				var marker = new google.maps.Marker({
					position: {
						lat: venue.location.lat,
						lng: venue.location.lng
					},
					map: map
				});

				bounds.extend(marker.position);

				marker.addListener('click', function() {
					infowindow.close();
					infowindow.setContent(contentString);
					infowindow.open(map, marker);
				});
			});
			map.fitBounds(bounds);
		});
	}

	// current weather
	function currentWeather(currentData) {
		var cloud_icon_url = "http://openweathermap.org/img/w/" + currentData.weather[0].icon + ".png";
		initMap(currentData.coord.lat, currentData.coord.lon, cloud_icon_url);
		if (!cityName) {
			cityName = currentData.name + ", " + currentData.sys.country;
		}
		var templateData = {
			city_name: cityName,
			weather_description: titleize(currentData.weather[0].description),
			cloud_icon_url: cloud_icon_url,
			temp_icon_url: "images/temperature.png",
			humidity_icon_url: "images/humidity.png",
			wind_icon_url: "images/wind.png",
			temp: Math.round(currentData.main.temp),
			humidity: currentData.main.humidity,
			wind: currentData.wind.speed.toFixed(1)
		};
		// mustache
		Mustache.parse(template); // optional, speeds up future uses
		var rendered = Mustache.render(template, {
			currentData: templateData
		});
		$('#target').html(rendered);
	}

	// make clock
	function startTime() {
		var time = strftime("%l:%M <span class='am-pm'>%p</span");
		$("#clock").html(time);
		$("#date").html(strftime("%B %e, %Y"));
		var t = setTimeout(startTime, 500);
	}
});