import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './WeatherPage.css'; 

const WeatherPage = () => {
  const { lat, lon } = useParams();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiKey = 'API KEY';

  const fetchWeather = async () => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      setWeatherData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch weather data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [lat, lon]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  // Leaflet marker icon fix
  const markerIcon = new L.Icon({
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Group forecasts by day and calculate daily highs/lows and weather summaries
  const dailyForecasts = weatherData.list.reduce((acc, forecast) => {
    const date = new Date(forecast.dt_txt).toLocaleDateString(); // Extracting the date part
    if (!acc[date]) {
      acc[date] = {
        tempMax: -Infinity,
        tempMin: Infinity,
        weather: {},
        rain: 0,
        snow: 0,
        details: [] // Storing each 3-hour forecast detail
      };
    }
    // Calculate high/low temperature
    acc[date].tempMax = Math.max(acc[date].tempMax, forecast.main.temp_max);
    acc[date].tempMin = Math.min(acc[date].tempMin, forecast.main.temp_min);

    // Count weather descriptions
    const description = forecast.weather[0].description;
    if (!acc[date].weather[description]) {
      acc[date].weather[description] = 0;
    }
    acc[date].weather[description]++;

    // Sum precipitation (rain and snow)
    acc[date].rain += forecast.rain?.['3h'] || 0;
    acc[date].snow += forecast.snow?.['3h'] || 0;

    // Adding details for this specific 3-hour period
    acc[date].details.push({
      time: new Date(forecast.dt_txt).toLocaleTimeString(),
      temp: forecast.main.temp,
      weather: forecast.weather[0].description,
      humidity: forecast.main.humidity,
      windSpeed: forecast.wind.speed,
      pressure: forecast.main.pressure
    });

    return acc;
  }, {});

  return (
    <div className="weather-container">
      <h1>Weather Forecast for {weatherData.city.name}</h1>
      <h3>{weatherData.city.country}</h3>

      {/* Responsive Map */}
      <div className="map-container">
        <MapContainer
          center={[lat, lon]}
          zoom={5}
          className="map"
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={[lat, lon]} icon={markerIcon}>
            <Popup>
              {weatherData.city.name}, {weatherData.city.country}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Daily Forecasts */}
      <h2>Daily Forecast</h2>
      {Object.keys(dailyForecasts).map((date) => {
        const dayForecast = dailyForecasts[date];
        const mostCommonWeather = Object.keys(dayForecast.weather).reduce((a, b) =>
          dayForecast.weather[a] > dayForecast.weather[b] ? a : b
        );
        const precipitationChance = dayForecast.rain > 0 || dayForecast.snow > 0;

        return (
          <div key={date} className="daily-forecast">
            <h3>{date}</h3>
            <ul className="daily-forecast-list">
              <li className="daily-forecast-list-item"><strong>High (°C):</strong> {dayForecast.tempMax}</li>
              <li className="daily-forecast-list-item"><strong>Low (°C):</strong> {dayForecast.tempMin}</li>
              <li className="daily-forecast-list-item"><strong>Weather:</strong> {mostCommonWeather}</li>
              <li className="daily-forecast-list-item"><strong>Precipitation:</strong> {precipitationChance ? 'Yes' : 'No'}</li>
            </ul>

            {/* Detailed Forecast Table for 3-hour Intervals */}
            <table className="detail-forecast-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Temperature (°C)</th>
                  <th>Weather</th>
                  <th>Humidity (%)</th>
                  <th>Wind Speed (m/s)</th>
                  <th>Pressure (hPa)</th>
                </tr>
              </thead>
              <tbody>
                {dayForecast.details.map((detail, index) => (
                  <tr key={index}>
                    <td>{detail.time}</td>
                    <td>{detail.temp}</td>
                    <td>{detail.weather}</td>
                    <td>{detail.humidity}</td>
                    <td>{detail.windSpeed}</td>
                    <td>{detail.pressure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr className='horizantal-line'/>
          </div>
        );
      })}
    </div>
  );
};

export default WeatherPage;
