import React, { useState, useEffect, useCallback, useRef } from 'react';
import Pagination from './Pagination';
import { css } from '@emotion/react';
import { SyncLoader } from 'react-spinners';

const ApiUrl = process.env.REACT_APP_API_URL;
const ApiKey = process.env.REACT_APP_API_KEY;

//css for the spinner
const spinnerStyle = css`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50px;
`;

const SearchPlaces = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [cities, setCities] = useState([]);
    const [error, setError] = useState(null);
    const [resultCount, setResultCount] = useState(3);
    const [startIndex, setStartIndex] = useState(0);
    const [limit, setLimit] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);


    //Ref for the search input
    const searchInputRef = useRef(null);

    //function to handle the Search 
    const handleSearch = useCallback(
        async (event) => {
            if (event) {
                event.preventDefault();
            }

            if (searchTerm.length >= 3) {
                try {
                    setLoading(true);

                    const response = await fetch(
                        `${ApiUrl}?namePrefix=${searchTerm}&limit=${limit}`,
                        {
                            method: 'GET',
                            headers: {
                                'X-RapidAPI-Key': ApiKey,
                                'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
                            },
                        }
                    );

                    if (!response.ok) {
                        throw new Error('Failed to fetch data');
                    }

                    const data = await response.json();
                    setCities(data.data);
                    setError(null);
                } catch (error) {
                    console.error('Error:', error);
                    setCities([]);
                    setError('Failed to fetch data');
                } finally {
                    setLoading(false);
                }



            }

        },
        [searchTerm, limit]
    );

    //Function to handle the change in api result count
    const handleLimitChange = (e) => {
        const newLimit = parseInt(e.target.value, 10);
        if (!isNaN(newLimit) && newLimit >= 1 && newLimit <= 10) {
            setLimit(newLimit);
        }
    };

    //Effect to trigger the search on mount and when resultCount or limit changes
    useEffect(() => {
        let timerOut = setTimeout(() => {
            handleSearch();
        }, 800)

        return () => clearTimeout(timerOut);

    }, [handleSearch, resultCount, limit]);

    //Effect to update the total pages when resultCount or cities change
    useEffect(() => {
        const totalPages = Math.ceil(cities.length / resultCount);
        setTotalPages(totalPages);
    }, [resultCount, cities]);

    //Function to handle page changes
    const handlePageChange = (page) => {
        setStartIndex((page - 1) * resultCount);
    };

    //Function to handle input change
    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    //Function to handle keydown event for Ctrl + /
    const handleKeyDown = (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === '/') {
            e.preventDefault();
            searchInputRef.current.focus();
        }
    };

    //Effect to add event listener for Ctrl + / on mount
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    //Function to get the flag URL
    const getFlagUrl = (countryCode) =>
        `https://countryflagsapi.com/png/${countryCode.toLowerCase()}`;


    return (
        <div className='container'>
            <form onSubmit={handleSearch}>
                <div className="search-container">
                    <label htmlFor="searchTerm">Enter city name: </label>
                    <input
                        type="text"
                        id="searchTerm"
                        value={searchTerm}
                        onChange={handleInputChange}
                        ref={searchInputRef}
                        placeholder={searchTerm.trim() === '' ? 'Search places...' : ''}
                    />
                    <span className='search-shortcut'>Ctrl + /</span>

                </div>
                <div>
                    <label htmlFor="resultCount">No. of items on a page: </label>
                    <input
                        type="number"
                        id="resultCount"
                        value={resultCount}
                        min="1"
                        onChange={(e) => setResultCount(Math.max(1, parseInt(e.target.value, 10)))}
                    />
                </div>
                <button type="submit">Search</button>
            </form>

            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Place Name</th>
                        <th>Country</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="3">
                                <SyncLoader
                                    css={spinnerStyle}
                                    size={10}
                                    margin={2}
                                    color={'#123abc'}
                                />
                            </td>
                        </tr>
                    ) : searchTerm.trim() === '' ? (
                        <tr>
                            <td colSpan="3">Start searching</td>
                        </tr>
                    ) : cities.length === 0 ? (
                        <tr>
                            <td colSpan="3">No result found</td>
                        </tr>
                    ) : (
                        cities.slice(startIndex, startIndex + resultCount).map((city, index) => (
                            <tr key={city.id}>
                                <td>{index + 1}</td>
                                <td>{city.name}</td>
                                <td>
                                    {/* <img src={getFlagUrl(city.countryCode)} alt={`${city.country} flag`} /> */}
                                    {city.country}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>


            <Pagination
                currentPage={(startIndex / resultCount) + 1}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />

            <div>
                <label htmlFor="limit">API Limit: </label>
                <input
                    type="number"
                    id="limit"
                    value={limit}
                    min="1"
                    max="10"
                    onChange={handleLimitChange}
                />
            </div>
        </div>
    );
};

export default SearchPlaces;
