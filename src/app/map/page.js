"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api'

export default function RequestPage() {
    const [cities, setCities] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [directions, setDirections] = useState(null)
    const [isCalculating, setIsCalculating] = useState(false)
    const autocompleteRef = useRef(null)
    const directionsServiceRef = useRef(null)

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

    const calculateOptimalRoute = async () => {
        if (cities.length < 2) {
            alert('Please add at least 2 places to calculate a route')
            return
        }

        setIsCalculating(true)

        try {
            // Create waypoints from all cities except the first one
            const waypoints = cities.slice(1).map(city => ({
                location: city,
                stopover: true
            }))

            const request = {
                origin: cities[0],
                destination: cities[cities.length - 1],
                waypoints: waypoints,
                optimizeWaypoints: true, // This enables route optimization
                travelMode: window.google.maps.TravelMode.DRIVING
            }

            directionsServiceRef.current.route(request, (result, status) => {
                setIsCalculating(false)
                if (status === 'OK') {
                    setDirections(result)
                    console.log('Optimized route:', result)
                } else {
                    console.error('Directions request failed due to ' + status)
                    alert('Failed to calculate route. Please check your place names.')
                }
            })
        } catch (error) {
            setIsCalculating(false)
            console.error('Error calculating route:', error)
            alert('Error calculating route. Please try again.')
        }
    }

    const clearRoute = () => {
        setDirections(null)
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
                directionsServiceRef.current = new window.google.maps.DirectionsService()
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
                        zoomControl: true,
                        streetViewControl: false
                    }}
                >
                    {directions && (
                        <DirectionsRenderer
                            directions={directions}
                            options={{
                                suppressMarkers: false,
                                polylineOptions: {
                                    strokeColor: '#FF0000',
                                    strokeWeight: 4
                                }
                            }}
                        />
                    )}
                </GoogleMap>
            ) : (
                <></>
            );
        }
    }, [directions]);

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

                {/* Route Controls */}
                {cities.length >= 2 && (
                    <div style={{ marginBottom: '20px' }}>
                        <button
                            onClick={calculateOptimalRoute}
                            disabled={isCalculating}
                            style={{
                                backgroundColor: isCalculating ? '#6c757d' : '#28a745',
                                color: 'white',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isCalculating ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                marginBottom: '10px',
                                width: '100%'
                            }}
                        >
                            {isCalculating ? 'Calculating...' : 'Calculate Optimal Route'}
                        </button>
                        {directions && (
                            <button
                                onClick={clearRoute}
                                style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    width: '100%'
                                }}
                            >
                                Clear Route
                            </button>
                        )}
                    </div>
                )}

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
