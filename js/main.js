$(function() {
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
			$('#chart-wrapper').prepend("<h1 id='city' class='text-center'>" + result.city.name +"</h1>");
		});
	});
});