"use client"

import React, { useState, useMemo, useRef } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

export default function RequestPage() {
    const [cities, setCities] = useState([])
    const [inputValue, setInputValue] = useState('')
    const autocompleteRef = useRef(null)

    const containerStyle = {
        width: '100%',
        height: '100%',
    };

    const center = {
        lat: -3.745,
        lng: -38.523,
    };

    const handleSubmit = (e) => {
        e.preventDefault()
        if (inputValue.trim()) {
            setCities([...cities, inputValue.trim()])
            setInputValue('')
        }
        console.log('Cities to travel to:', cities)
    }

    const handleInputChange = (e) => {
        setInputValue(e.target.value)
    }

    const removeCity = (index) => {
        const newCities = cities.filter((_, i) => i !== index)
        setCities(newCities)
    }

    const MyComponent = useMemo(() => {
        return function MapComponent() {
            const { isLoaded } = useJsApiLoader({
                id: 'google-map-script',
                googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
                libraries: ['places'],
            });

            const [map, setMap] = React.useState(null);

            const onLoad = React.useCallback(function callback(map) {
                const bounds = new window.google.maps.LatLngBounds(center);
                map.fitBounds(bounds);
                setMap(map);
            }, []);

            const onUnmount = React.useCallback(function callback(map) {
                setMap(null);
            }, []);

            React.useEffect(() => {
                if (isLoaded && window.google) {
                    autocompleteRef.current = new window.google.maps.places.Autocomplete(
                        document.getElementById('place-input'),
                        { types: ['(cities)'] }
                    )

                    autocompleteRef.current.addListener('place_changed', () => {
                        const place = autocompleteRef.current.getPlace()
                        if (place.formatted_address) {
                            setInputValue(place.formatted_address)
                        }
                    })
                }
            }, [isLoaded])

            return isLoaded ? (
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={10}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={{
                        zoomControl: true
                    }}
                >
                    {/* Child components, such as markers, info windows, etc. */}
                    <></>
                </GoogleMap>
            ) : (
                <></>
            );
        }
    }, []);

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Form Section */}
            <div style={{
                width: '300px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRight: '1px solid #ddd'
            }}>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>Travel Cities</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label htmlFor="place-input" style={{
                            display: 'block',
                            marginBottom: '5px',
                            fontWeight: 'bold',
                            color: '#555'
                        }}>
                            Add a place:
                        </label>
                        <input
                            id="place-input"
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            placeholder="Start typing a city name..."
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontFamily: 'Arial, sans-serif',
                                color: 'black',
                                fontSize: '14px'
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            backgroundColor: '#007bff',
                            color: 'white',
                            padding: '10px 20px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            marginBottom: '15px'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                        Add Place
                    </button>
                </form>

                {/* Display added places */}
                {cities.length > 0 && (
                    <div>
                        <h3 style={{ marginBottom: '10px', color: '#333', fontSize: '16px' }}>
                            Added Places ({cities.length}):
                        </h3>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {cities.map((city, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 12px',
                                        backgroundColor: 'white',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        marginBottom: '5px'
                                    }}
                                >
                                    <span style={{ color: '#333', fontSize: '14px' }}>
                                        {index + 1}. {city}
                                    </span>
                                    <button
                                        onClick={() => removeCity(index)}
                                        style={{
                                            backgroundColor: '#dc3545',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '3px',
                                            padding: '4px 8px',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                        onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                                        onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Map Section */}
            <div style={{ flex: 1 }}>
                <MyComponent />
            </div>
        </div>
    );
}
