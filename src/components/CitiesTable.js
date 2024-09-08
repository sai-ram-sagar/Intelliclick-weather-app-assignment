import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './CitiesTable.css'; // Import the CSS file

const CitiesTable = () => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchCities = async () => {
    if (loading) return; // Prevent multiple fetches at the same time
    setLoading(true);
    try {
      const response = await axios.get(
        `https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-all-cities-with-a-population-1000&q=${search}&rows=100&start=${page * 20}`
      );
      const newCities = response.data.records.map((record) => ({
        name: record.fields?.name,
        country: record.fields?.cou_name_en,
        timezone: record.fields?.timezone,
        population: record.fields?.population,
        coordinates: record.fields?.coordinates, // coordinates as [lon, lat]
      }));

      // Sort by country name
      newCities.sort((a, b) => (a.country || '').localeCompare(b.country || ''));

      if (search) {
        setCities(newCities); // When searching, replace the cities list
        setHasMore(false);    // No need for infinite scroll during search
      } else {
        setCities((prev) => (page === 0 ? newCities : [...prev, ...newCities])); // Infinite scroll behavior
        setHasMore(newCities.length > 0); // Determine if more data exists
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities(); // Fetch cities whenever page or search changes
  }, [page, search]);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollHeight - scrollTop <= clientHeight + 100 && !loading && !search && hasMore) {
        setPage((prev) => prev + 1); // Load next page if scrolling near bottom
      }
    };

    if (!search) {
      window.addEventListener('scroll', handleScroll); // Attach scroll listener
    } else {
      window.removeEventListener('scroll', handleScroll); // Remove scroll listener if searching
    }

    return () => {
      window.removeEventListener('scroll', handleScroll); // Clean up listener on unmount
    };
  }, [search, loading, hasMore]);

  return (
    <div className='cities-table-page'>
      <h1 className='main-heading'>Cities Table</h1>
      <input
        type="text"
        placeholder="Search city"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0); // Reset to page 0 on new search
        }}
      />
      <table>
        <thead>
          <tr>
            <th>City Name</th>
            <th>Country</th>
            <th>Timezone</th>
            <th>Population</th>
          </tr>
        </thead>
        <tbody>
          {cities.map((city, index) => (
            <tr key={index}>
              <td>
                <Link
                  to={`/weather/${city.coordinates?.[1]}/${city.coordinates?.[0]}`} // Use [lat, lon] correctly
                >
                  {city.name}
                </Link>
              </td>
              <td>{city.country}</td>
              <td>{city.timezone}</td>
              <td>{city.population}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div className="loading">Loading...</div>}
    </div>
  );
};

export default CitiesTable;
