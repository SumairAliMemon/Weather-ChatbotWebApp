
$(document).ready(function() {
  let forecastData = [];
  const weatherApiKey = '044a716d9a4d2293fc98b5a5d3f97b81';
  let city = '';
  let currentPage = 0;
  const itemsPerPage = 10;

  function getWeather(city) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${weatherApiKey}`;
    $('.loader').show();

    $.get(apiUrl, function(data) {
      forecastData = data.list;
      console.log(forecastData);
      displayForecast(forecastData.slice(0, itemsPerPage));
      updatePagination();
      updateBackground(data.list[0].weather[0].main);
    }).fail(function() {
      $('#error-message').text('City not found or API limit reached.').removeClass('hidden');
    }).always(function() {
      $('.loader').hide();
    });
  }

  function displayForecast(data) {
    $('#forecast').empty();
    $('#error-message').addClass('hidden');
    
    data.forEach(forecast => {
      const date = new Date(forecast.dt * 1000).toLocaleDateString();
      const time = new Date(forecast.dt * 1000).toLocaleTimeString();
      const temp = forecast.main.temp;
      const condition = forecast.weather[0].main;
      const humidity = forecast.main.humidity;
      const windSpeed = forecast.wind.speed;

      $('#forecast').append(`
        <tr class="hover:bg-gray-700">
          <td class="border px-4 py-2">${date}</td>
          <td class="border px-4 py-2">${time}</td>
          <td class="border px-4 py-2">${temp.toFixed(1)}°C</td>
          <td class="border px-4 py-2">${condition}</td>
        </tr>
      `);
    });
  }

  function filterAndDisplayData() {
    const filterValue = $('#filter-options').val();
    let filteredData = [...forecastData];

    switch(filterValue) {
      case 'sort-asc':
        filteredData.sort((a, b) => a.main.temp - b.main.temp);
        break;
      case 'sort-desc':
        filteredData.sort((a, b) => b.main.temp - a.main.temp);
        break;
      case 'filter-rain':
        filteredData = filteredData.filter(item => item.weather[0].main.toLowerCase().includes('rain'));
        break;
      case 'filter-clear':
        filteredData = filteredData.filter(item => item.weather[0].main.toLowerCase().includes('clear'));
        break;
    }

    currentPage = 0;
    displayForecast(filteredData.slice(0, itemsPerPage));
    updatePagination();
  }

  function updatePagination() {
    $('#prev-btn').prop('disabled', currentPage === 0);
    $('#next-btn').prop('disabled', (currentPage + 1) * itemsPerPage >= forecastData.length);
  }

  function updateBackground(weatherCondition) {
    const backgrounds = {
      Clear: 'linear-gradient(to right, #56CCF2, #2e8fdd)',
      Clouds: 'linear-gradient(to right, #757F9A, #D7DDE8)',
      Rain: 'linear-gradient(to right, #373B44, #328424)',
      Snow: 'linear-gradient(to right, #E0EAFC, #CFDEF3)',
      Default: 'linear-gradient(to right, #2C3E50, #3498DB)'
    };

    const background = backgrounds[weatherCondition] || backgrounds.Default;
    $('#fivedays').css('background', background);
  }

  function isWeatherRelated(message) {
    const weatherKeywords = [
      "weather", "temperature", "forecast", "rain", "clear", 
      "wind", "humidity", "max", "min", "average", "cold", 
      "hot", "sunny", "cloudy", "storm", "precipitation"
    ];
    return weatherKeywords.some(keyword => message.toLowerCase().includes(keyword));
  }
  function getForecastData() {
    const structuredData = forecastData.map(data => {
      const dateTime = new Date(data.dt * 1000); // Convert Unix timestamp to JS Date object
      const formattedDate = dateTime.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      const formattedTime = dateTime.toTimeString().split(' ')[0]; // Get HH:mm:ss format
  
      // Extract the weather condition from the first entry in the weather array
      const condition = data.weather.length > 0 ? data.weather[0].description : "No condition available";
  
      return {
        temperature: data.main.temp,  // Extract temperature
        condition: condition,           // Extract weather condition
        date: formattedDate,           // Extract formatted date
        time: formattedTime            // Extract formatted time
      };
    });
  
    return structuredData;
  }
    function calculateAverage(data, field) {
    const sum = data.reduce((acc, curr) => acc + curr[field], 0);
    return (sum / data.length).toFixed(2);
  }

  function findMax(data, field) {
    return Math.max(...data.map(item => item[field]));
  }

  function findMin(data, field) {
    return Math.min(...data.map(item => item[field]));
  }

  function formatForecastDataForPrompt(data) {
    return data.map(item => ({
      date: item.date,
      time: item.time,
      temperature: item.temp + '°C',
      condition: item.weather,
      humidity: item.humidity + '%',
      windSpeed: item.wind + ' km/h'
    }));
  }

  async function handleGeminiResponse(userQuestion, weatherData) {
    const prompt = `
      Based on the following 5-day weather forecast data:
      ${JSON.stringify(weatherData, null, 2)}
      
      Please answer this weather-related question: "${userQuestion}"
      
      Provide a clear and concise response focusing on the weather data provided.
      If the question cannot be answered with the given data, please say so.
    `;


    console.log(prompt);

    try {
      const response = await callGeminiAPI(prompt);
      return response;
    } catch (error) {
      console.error("Error getting Gemini response:", error);
      return "I'm sorry, I couldn't process your weather-related question at the moment.";
    }
  }

  async function callGeminiAPI(prompt) {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    const GEMINI_API_KEY = 'AIzaSyAlgT6u215CHu_WHLKkbMO58gQ9CROy_v8';

    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    try {
      const response = await $.ajax({
        url: `${apiUrl}?key=${GEMINI_API_KEY}`,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(payload),
        dataType: 'json'
      });

      if (response.candidates && response.candidates.length > 0 && 
          response.candidates[0].content && 
          response.candidates[0].content.parts && 
          response.candidates[0].content.parts.length > 0) {
        return response.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response structure");
      }
    } catch (error) {
      throw new Error(`API Error: ${error.status || 'Unknown'} - ${error.responseText || error.message}`);
    }
  }

  async function getWeatherResponse(message) {
    const data = getForecastData();
    console.log(data);
    if (data.length === 0) {

      return "Please search for a city first to get weather data.";
    }

   // console.log(apiUrl);
    if (message.includes("average temperature")) {
      const avgTemp = calculateAverage(data, 'temp');
      return `The average temperature over the next 5 days is ${avgTemp}°C.`;
    } else if (message.includes("maximum temperature")) {
      const maxTemp = findMax(data, 'temp');
      return `The maximum temperature in the next 5 days is ${maxTemp}°C.`;
    } else if (message.includes("minimum temperature")) {
      const minTemp = findMin(data, 'temp');
      return `The minimum temperature in the next 5 days is ${minTemp}°C.`;
    } else if (message.includes("average humidity")) {
      const avgHumidity = calculateAverage(data, 'humidity');
      return `The average humidity over the next 5 days is ${avgHumidity}%.`;
    } else if (message.includes("maximum humidity")) {
      const maxHumidity = findMax(data, 'humidity');
      return `The maximum humidity in the next 5 days is ${maxHumidity}%.`;
    } else if (message.includes("minimum humidity")) {
      const minHumidity = findMin(data, 'humidity');
      return `The minimum humidity in the next 5 days is ${minHumidity}%.`;
    } else if (message.includes("average wind")) {
      const avgWind = calculateAverage(data, 'wind');
      return `The average wind speed over the next 5 days is ${avgWind} km/h.`;
    } else if (message.includes("maximum wind")) {
      const maxWind = findMax(data, 'wind');
      return `The maximum wind speed in the next 5 days is ${maxWind} km/h.`;
    } else if (message.includes("minimum wind")) {
      const minWind = findMin(data, 'wind');
      return `The minimum wind speed in the next 5 days is ${minWind} km/h.`;
    } else {
      const formattedData = formatForecastDataForPrompt(data);
      console.log(forecastData);
      return await handleGeminiResponse(message, data);
    }
  }

  // Event Listeners
  $('#searchbtn').click(function() {
    city = $('#cityInput').val();
    if (city.trim() !== '') {
      currentPage = 0;
      getWeather(city);
    } else {
      $('#error-message').text('Please enter a city name.').removeClass('hidden');
    }
  });

  $('#filter-options').change(filterAndDisplayData);

  $('#prev-btn').click(function() {
    if (currentPage > 0) {
      currentPage--;
      displayForecast(forecastData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage));
      updatePagination();
    }
  });

  $('#next-btn').click(function() {
    if ((currentPage + 1) * itemsPerPage < forecastData.length) {
      currentPage++;
      displayForecast(forecastData.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage));
      updatePagination();
    }
  });

  $('#send-btn').click(async function() {
    const message = $('#chat-input').val().trim();

    if (message !== '') {
      $('#chat-messages').append(`
        <div class="bg-blue-500 text-white p-2 rounded mb-2">
          You: ${message}
        </div>
      `);

      $('#typing-indicator').show();

      try {
        let response;
        if (isWeatherRelated(message)) {
          response = await getWeatherResponse(message);
        } else {
          response = await callGeminiAPI(message);
        }

        $('#chat-messages').append(`
          <div class="bg-gray-700 text-white p-2 rounded mb-2">
            Bot: ${response}
          </div>
        `);
      } catch (error) {
        $('#chat-messages').append(`
          <div class="bg-red-500 text-white p-2 rounded mb-2">
            Bot: Sorry, I encountered an error processing your request.
          </div>
        `);
        console.error(error);
      }

      $('#typing-indicator').hide();
      $('#chat-input').val('');
      $('#chat-messages').scrollTop($('#chat-messages')[0].scrollHeight);
    }
  });

  $('#chat-input').keypress(function(e) {
    if (e.which == 13) {
      $('#send-btn').click();
    }
  });
});