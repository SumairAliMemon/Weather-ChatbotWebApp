$(document).ready(function() {
    const apiKey = '044a716d9a4d2293fc98b5a5d3f97b81';
    let temperatureBarChart, weatherConditionsChart, temperatureLineChart;

    $('#search-btn').click(function() {
        const city = $('#city-input').val();
        if (city) {
            fetchWeatherData(city);
        }
    });

    function fetchWeatherData(city) {
        $('#loader').removeClass('hidden');
        $('#weather-info').addClass('hidden');

        $.ajax({
            url: `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`,
            method: 'GET',
            success: function(data) {
                displayCurrentWeather(data);
                $('#loader').addClass('hidden');
            },
            error: function() {
                alert('Error fetching weather data. Please try again.');
                $('#loader').addClass('hidden');
            }
        });
    }

    function displayCurrentWeather(data) {
        const city = data.city.name;
        const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));
        const temperatures = dailyData.map(item => Math.round(item.main.temp));
        const conditions = dailyData.map(item => item.weather[0].main);
        const icons = dailyData.map(item => `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`);

        $('#city-display').text(city);
        $('#weather-condition').text(conditions[0]);
        $('#temperature').text(temperatures[0]);
        $('#weather-icon').attr('src', icons[0]);
        $('#weather-info').removeClass('hidden');
        
        setWeatherBackground(conditions[0]);

        $('#temperature-display').html(`${temperatures[0]}°C <img src="${icons[0]}" alt="${conditions[0]} icon">`);
        
        const conditionPoints = calculateConditionPoints(conditions);
        drawCharts(temperatures, conditionPoints);
    }

    function setWeatherBackground(condition) {
        const backgroundElement = $('#weather-info');
        let gradient;

        switch (condition.toLowerCase()) {
            case 'clear':
                gradient = 'linear-gradient(135deg, #6DD5FA, #FF758C)';
                break;
            case 'clouds':
                gradient = 'linear-gradient(135deg, #606c88, #3f4c6b)';
                break;
            case 'rain':
                gradient = 'linear-gradient(135deg, #3a7bd5, #00d2ff)';
                break;
            case 'snow':
                gradient = 'linear-gradient(135deg, #E0EAFC, #CFDEF3)';
                break;
            case 'drizzle':
                gradient = 'linear-gradient(135deg, #89F7FE, #66A6FF)';
                break;
            case 'thunderstorm':
                gradient = 'linear-gradient(135deg, #141E30, #243B55)';
                break;
            case 'mist':
            case 'fog':
                gradient = 'linear-gradient(135deg, #757F9A, #D7DDE8)';
                break;
            default:
                gradient = 'linear-gradient(135deg, #2C3E50, #4CA1AF)';
        }

        backgroundElement.css({
            'background': gradient,
            'opacity': '0.8',
            'transition': 'background 0.5s ease-in-out'
        });
    }

    function calculateConditionPoints(conditions) {
        const conditionCounts = {};
        conditions.forEach(condition => {
            conditionCounts[condition] = (conditionCounts[condition] || 0) + 1;
        });
        return conditionCounts;
    }

    function drawCharts(temperatures, conditionPoints) {
        const ctxBar = $('#temperatureBarChart');
        const ctxDoughnut = $('#weatherConditionsChart');
        const ctxLine = $('#temperatureLineChart');

        if (temperatureBarChart) temperatureBarChart.destroy();
        if (weatherConditionsChart) weatherConditionsChart.destroy();
        if (temperatureLineChart) temperatureLineChart.destroy();

        // Create Bar Chart
        temperatureBarChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: temperatures.map((_, index) => `Day ${index + 1}`),
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temperatures,
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        // Create Doughnut Chart
        const conditionKeys = Object.keys(conditionPoints);
        const conditionValues = Object.values(conditionPoints);

        // Minimum conditions required for the doughnut chart
        const requiredConditions = ['Rain', 'Clear', 'Clouds', 'Snow', 'Drizzle'];
        requiredConditions.forEach(condition => {
            if (!conditionKeys.includes(condition)) {
                conditionKeys.push(condition);
                conditionValues.push(0);
            }
        });

        const minimumConditions = 5;
        if (conditionKeys.length < minimumConditions) {
            const additionalNeeded = minimumConditions - conditionKeys.length;
            for (let i = 0; i < additionalNeeded; i++) {
                conditionKeys.push('Others');
                conditionValues.push(0);
            }
        }

        weatherConditionsChart = new Chart(ctxDoughnut, {
            type: 'doughnut',
            data: {
                labels: conditionKeys,
                datasets: [{
                    data: conditionValues,
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#66BB6A',
                        '#FFA726',
                        '#8D6E63',
                        '#795548'
                    ],
                    hoverBackgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#66BB6A',
                        '#FFA726',
                        '#8D6E63',
                        '#795548'
                    ]
                }]
            }
        });

        // Create Line Chart
        temperatureLineChart = new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: temperatures.map((_, index) => `Day ${index + 1}`),
                datasets: [{
                    label: 'Temperature (°C)',
                    data: temperatures,
                    fill: false,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
});