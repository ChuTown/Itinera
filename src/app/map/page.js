"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api'

export default function RequestPage() {
    const [startPoint, setStartPoint] = useState('')
    const [endPoint, setEndPoint] = useState('')
    const [intermediateCities, setIntermediateCities] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [directions, setDirections] = useState(null)
    const [isCalculating, setIsCalculating] = useState(false)
    const [suggestedPlaceMarkers, setSuggestedPlaceMarkers] = useState([])
    const [suggestedPlacesInRoute, setSuggestedPlacesInRoute] = useState([])
    const [blueDirections, setBlueDirections] = useState(null)
    const autocompleteRef = useRef(null)
    const startAutocompleteRef = useRef(null)
    const endAutocompleteRef = useRef(null)
    const intermediateAutocompleteRef = useRef(null)
    const directionsServiceRef = useRef(null)
    const geocoderRef = useRef(null)
    const [sidebarTab, setSidebarTab] = useState('route'); // 'route' or 'places'
    const [vibe, setVibe] = useState('');
    const [suggestedPlaces, setSuggestedPlaces] = useState([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [addedPlaces, setAddedPlaces] = useState([]); // For places added to route from suggestions
    const [map, setMap] = React.useState(null);

    const containerStyle = {
        width: '100%',
        height: '100%',
    };

    const center = {
        lat: 43.51564092714851,
        lng: -80.51369485785276,
    };

    const handleSubmit = (e) => {
        e.preventDefault()
        if (inputValue.trim()) {
            setIntermediateCities([...intermediateCities, inputValue.trim()])
            setInputValue('')
        }
        console.log('Cities to travel to:', intermediateCities)
    }

    const handleInputChange = (e) => {
        setInputValue(e.target.value)
    }

    const removeCity = (index) => {
        const newCities = intermediateCities.filter((_, i) => i !== index)
        setIntermediateCities(newCities)
    }

    const calculateOptimalRoute = React.useCallback(async (stops) => {
        if (!startPoint.trim() || !endPoint.trim()) {
            alert('Please enter both starting and ending points')
            return
        }

        setIsCalculating(true)

        try {
            const waypoints = stops.map(city => ({
                location: city,
                stopover: true
            }))

            const request = {
                origin: startPoint,
                destination: endPoint,
                waypoints: waypoints,
                optimizeWaypoints: true,
                travelMode: window.google.maps.TravelMode.DRIVING
            }

            directionsServiceRef.current.route(request, (result, status) => {
                setIsCalculating(false)
                if (status === 'OK') {
                    setDirections(result)
                    setIntermediateCities(stops)
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
    }, [startPoint, endPoint]);

    const clearRoute = () => {
        setDirections(null)
        setBlueDirections(null)
        setSuggestedPlacesInRoute([])
    }

    const addSuggestedPlaceToRoute = (place) => {
        // Check if place is already in the route
        if (suggestedPlacesInRoute.some(p => p.id === `${place.place}-${place.city}`)) {
            alert(`${place.place} is already in your route.`);
            return;
        }

        const placeWithId = {
            ...place,
            id: `${place.place}-${place.city}`
        };

        setSuggestedPlacesInRoute(prev => [...prev, placeWithId]);

        // Calculate blue route to this tourist attraction
        calculateBlueRoute(placeWithId);
    };

    const calculateBlueRoute = (place) => {
        if (!directionsServiceRef.current) return;

        // Find the nearest city to this place for routing
        const nearestCity = place.city;

        // Calculate route from the nearest city to the tourist attraction
        const request = {
            origin: nearestCity,
            destination: `${place.place}, ${place.city}`,
            travelMode: window.google.maps.TravelMode.DRIVING
        };

        directionsServiceRef.current.route(request, (result, status) => {
            if (status === 'OK') {
                setBlueDirections(prev => {
                    const newDirections = prev ? [...prev, result] : [result];
                    return newDirections;
                });
            } else {
                console.error('Blue route calculation failed:', status);
            }
        });
    };

    const removeSuggestedPlaceFromRoute = (placeId) => {
        setSuggestedPlacesInRoute(prev => prev.filter(p => p.id !== placeId));

        // Remove the corresponding blue route
        setBlueDirections(prev => {
            if (prev && prev.length > 0) {
                return prev.slice(0, -1); // Remove the last blue route
            }
            return null;
        });
    };

    const geocodeSuggestedPlaces = async (places) => {
        if (!geocoderRef.current) return;

        const geocodePromise = (place) => {
            return new Promise((resolve) => {
                const address = `${place.place}, ${place.city}`;
                geocoderRef.current.geocode({ address }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const location = results[0].geometry.location;
                        resolve({
                            id: `${place.place}-${place.city}`,
                            position: {
                                lat: location.lat(),
                                lng: location.lng()
                            },
                            title: place.place,
                            description: place.description,
                            city: place.city
                        });
                    } else {
                        // Fallback to geocoding just the city
                        geocoderRef.current.geocode({ address: place.city }, (cityResults, cityStatus) => {
                            if (cityStatus === 'OK' && cityResults[0]) {
                                const location = cityResults[0].geometry.location;
                                resolve({
                                    id: `${place.place}-${place.city}`,
                                    position: {
                                        lat: location.lat(),
                                        lng: location.lng()
                                    },
                                    title: place.place,
                                    description: place.description,
                                    city: place.city
                                });
                            } else {
                                console.error(`Geocoding failed for ${address}: ${status}, and fallback for ${place.city} failed: ${cityStatus}`);
                                resolve(null); // Resolve with null if both attempts fail
                            }
                        });
                    }
                });
            });
        };

        try {
            const markerPromises = places.map(geocodePromise);
            const markers = await Promise.all(markerPromises);
            const validMarkers = markers.filter(marker => marker !== null);

            // Jitter markers that have the exact same coordinates
            const positionCounts = {};
            const jitteredMarkers = validMarkers.map(marker => {
                const posString = `${marker.position.lat},${marker.position.lng}`;
                if (positionCounts[posString]) {
                    const jitteredPosition = {
                        lat: marker.position.lat + (Math.random() - 0.5) / 1500, // ~75m offset
                        lng: marker.position.lng + (Math.random() - 0.5) / 1500,
                    };
                    positionCounts[posString]++;
                    return { ...marker, position: jitteredPosition };
                } else {
                    positionCounts[posString] = 1;
                    return marker;
                }
            });

            setSuggestedPlaceMarkers(jitteredMarkers);
        } catch (error) {
            console.error('An error occurred during geocoding:', error);
        }
    };

    const handlePanToMarker = (place) => {
        const markerId = `${place.place}-${place.city}`;
        const targetMarker = suggestedPlaceMarkers.find(m => m.id === markerId);

        if (targetMarker && map) {
            map.panTo(targetMarker.position);
            map.setZoom(15);
        }
    };

    const MyComponent = useMemo(() => {
        return function MapComponent() {
            const { isLoaded } = useJsApiLoader({
                id: 'google-map-script',
                googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
                libraries: ['places'],
            });

            const onLoad = React.useCallback(function callback(mapInstance) {
                setMap(mapInstance);
                directionsServiceRef.current = new window.google.maps.DirectionsService()
                geocoderRef.current = new window.google.maps.Geocoder()
            }, []);

            const onUnmount = React.useCallback(function callback(map) {
                setMap(null);
            }, []);

            React.useEffect(() => {
                if (isLoaded && window.google && sidebarTab === 'route') {
                    const startInputElement = document.getElementById('start-input');
                    if (startInputElement) {
                        startAutocompleteRef.current = new window.google.maps.places.Autocomplete(
                            startInputElement,
                            { types: ['(cities)'] }
                        )
                        startAutocompleteRef.current.addListener('place_changed', () => {
                            const place = startAutocompleteRef.current.getPlace()
                            if (place.formatted_address) {
                                setStartPoint(place.formatted_address)
                            }
                        })
                    }

                    const endInputElement = document.getElementById('end-input');
                    if (endInputElement) {
                        endAutocompleteRef.current = new window.google.maps.places.Autocomplete(
                            endInputElement,
                            { types: ['(cities)'] }
                        )
                        endAutocompleteRef.current.addListener('place_changed', () => {
                            const place = endAutocompleteRef.current.getPlace()
                            if (place.formatted_address) {
                                setEndPoint(place.formatted_address)
                            }
                        })
                    }

                    const intermediateInputElement = document.getElementById('place-input');
                    if (intermediateInputElement) {
                        intermediateAutocompleteRef.current = new window.google.maps.places.Autocomplete(
                            intermediateInputElement,
                            { types: ['(cities)'] }
                        )
                        intermediateAutocompleteRef.current.addListener('place_changed', () => {
                            const place = intermediateAutocompleteRef.current.getPlace()
                            if (place.formatted_address) {
                                setInputValue(place.formatted_address)
                            }
                        })
                    }
                }
            }, [isLoaded, sidebarTab]);

            return isLoaded ? (
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={8}
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

                    {/* Blue routes to tourist attractions */}
                    {blueDirections && blueDirections.map((direction, index) => (
                        <DirectionsRenderer
                            key={`blue-route-${index}`}
                            directions={direction}
                            options={{
                                suppressMarkers: true, // Don't show markers for blue routes
                                polylineOptions: {
                                    strokeColor: '#0066CC',
                                    strokeWeight: 3,
                                    strokeOpacity: 0.8
                                }
                            }}
                        />
                    ))}

                    {/* Yellow markers for suggested places */}
                    {suggestedPlaceMarkers.map((marker) => (
                        <Marker
                            key={marker.id}
                            position={marker.position}
                            title={`${marker.title} - ${marker.city}`}
                            options={{
                                icon: {
                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#FFC107"/>
                                        </svg>
                                    `),
                                    scaledSize: new window.google.maps.Size(40, 40),
                                    anchor: new window.google.maps.Point(20, 40)
                                }
                            }}
                            onClick={() => {
                                // Add the place to the route with blue directions
                                addSuggestedPlaceToRoute({
                                    place: marker.title,
                                    description: marker.description,
                                    city: marker.city
                                });
                            }}
                        />
                    ))}
                </GoogleMap>
            ) : (
                <></>
            );
        }
    }, [directions, suggestedPlaceMarkers, blueDirections, sidebarTab]);

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Form Section */}
            <div style={{
                width: '300px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRight: '1px solid #ddd'
            }}>
                <h2 style={{ marginBottom: '20px', color: '#333' }}>Travel Route Planner</h2>

                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <button
                        onClick={() => setSidebarTab('route')}
                        style={{
                            flex: 1,
                            backgroundColor: sidebarTab === 'route' ? '#007bff' : '#e0e0e0',
                            color: sidebarTab === 'route' ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '4px 0 0 4px',
                            padding: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: 14
                        }}
                    >
                        Route Planner
                    </button>
                    <button
                        onClick={() => setSidebarTab('places')}
                        style={{
                            flex: 1,
                            backgroundColor: sidebarTab === 'places' ? '#007bff' : '#e0e0e0',
                            color: sidebarTab === 'places' ? 'white' : '#333',
                            border: 'none',
                            borderRadius: '0 4px 4px 0',
                            padding: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: 14
                        }}
                    >
                        Places
                    </button>
                </div>

                {sidebarTab === 'route' && (
                    <>
                        {/* Starting Point */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="start-input" style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold',
                                color: '#555'
                            }}>
                                Starting Point:
                            </label>
                            <input
                                id="start-input"
                                type="text"
                                value={startPoint}
                                onChange={(e) => setStartPoint(e.target.value)}
                                placeholder="Enter starting location..."
                                autoComplete="on"
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

                        {/* Ending Point */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="end-input" style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold',
                                color: '#555'
                            }}>
                                Ending Point:
                            </label>
                            <input
                                id="end-input"
                                type="text"
                                value={endPoint}
                                onChange={(e) => setEndPoint(e.target.value)}
                                placeholder="Enter destination..."
                                autoComplete="on"
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

                        {/* Intermediate Cities */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="place-input" style={{
                                display: 'block',
                                marginBottom: '5px',
                                fontWeight: 'bold',
                                color: '#555'
                            }}>
                                Add Intermediate Stops:
                            </label>
                            <form onSubmit={handleSubmit}>
                                <input
                                    id="place-input"
                                    type="text"
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    placeholder="Add cities to visit along the way..."
                                    autoComplete="on"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ccc',
                                        borderRadius: '4px',
                                        fontFamily: 'Arial, sans-serif',
                                        color: 'black',
                                        fontSize: '14px',
                                        marginBottom: '10px'
                                    }}
                                />
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
                                        width: '100%'
                                    }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                                    onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                                >
                                    Add Stop
                                </button>
                            </form>
                        </div>

                        {/* Route Controls */}
                        {startPoint.trim() && endPoint.trim() && (
                            <div style={{ marginBottom: '20px' }}>
                                <button
                                    onClick={() => calculateOptimalRoute(intermediateCities)}
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
                        {intermediateCities.length > 0 && (
                            <div>
                                <h3 style={{ marginBottom: '10px', color: '#333', fontSize: '16px' }}>
                                    Intermediate Stops ({intermediateCities.length}):
                                </h3>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {intermediateCities.map((city, index) => (
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

                        {/* Route Legend */}
                        {(directions || blueDirections) && (
                            <div style={{
                                marginTop: 20,
                                padding: 10,
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #dee2e6',
                                borderRadius: 4
                            }}>
                                <h4 style={{ marginBottom: 8, color: '#333', fontSize: '14px' }}>Route Legend:</h4>
                                <div style={{ fontSize: '12px', color: '#666' }}>
                                    <div style={{ marginBottom: 4 }}>
                                        🔴 <strong>Red Route:</strong> Travel between cities
                                    </div>
                                    {blueDirections && blueDirections.length > 0 && (
                                        <div>
                                            🔵 <strong>Blue Route:</strong> Travel to tourist attractions
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {sidebarTab === 'places' && (
                    <div>
                        <label htmlFor="vibe-input" style={{ display: 'block', marginBottom: 5, fontWeight: 'bold', color: '#555' }}>
                            What kind of vibe are you looking for?
                        </label>
                        <input
                            id="vibe-input"
                            type="text"
                            value={vibe}
                            onChange={e => setVibe(e.target.value)}
                            placeholder="e.g., adventurous, romantic, food lover…"
                            autoComplete="on"
                            style={{
                                width: '100%',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                fontFamily: 'Arial, sans-serif',
                                color: 'black',
                                fontSize: '14px',
                                marginBottom: '10px'
                            }}
                        />
                        <button
                            onClick={async () => {
                                setIsLoadingSuggestions(true);
                                setSuggestedPlaces([]);
                                setSuggestedPlaceMarkers([]); // Clear existing markers
                                try {
                                    const res = await fetch('/api/suggestedPlaces', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            cities: [startPoint, ...intermediateCities, endPoint].filter(Boolean),
                                            vibe
                                        })
                                    });
                                    const data = await res.json();
                                    if (res.ok) {
                                        setSuggestedPlaces(data);
                                        // Geocode the suggested places to create yellow markers
                                        geocodeSuggestedPlaces(data);
                                    } else {
                                        alert(data.error || 'Failed to get suggestions.');
                                        setSuggestedPlaces([]);
                                    }
                                } catch (e) {
                                    setSuggestedPlaces([]);
                                    alert('An error occurred while fetching suggestions.');
                                }
                                setIsLoadingSuggestions(false);
                            }}
                            disabled={!vibe.trim() || !startPoint || !endPoint || isCalculating}
                            style={{
                                backgroundColor: (!vibe.trim() || !startPoint || !endPoint || isCalculating) ? '#ccc' : '#007bff',
                                color: 'white',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: (!vibe.trim() || !startPoint || !endPoint || isCalculating) ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                width: '100%',
                                marginBottom: 16
                            }}
                        >
                            {isLoadingSuggestions ? 'Loading...' : 'Get Suggested Places'}
                        </button>
                        {suggestedPlaces.length > 0 && (
                            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                {suggestedPlaceMarkers.length > 0 && (
                                    <div style={{
                                        background: '#fff3cd',
                                        border: '1px solid #ffeaa7',
                                        borderRadius: 4,
                                        padding: 8,
                                        marginBottom: 10,
                                        fontSize: 12,
                                        color: '#856404'
                                    }}>
                                        🟡 {suggestedPlaceMarkers.length} yellow marker(s) displayed on the map
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setSuggestedPlaces([]);
                                        setSuggestedPlaceMarkers([]);
                                        setSuggestedPlacesInRoute([]);
                                        setBlueDirections(null);
                                    }}
                                    style={{
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: 4,
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        fontSize: 13,
                                        marginBottom: 10,
                                        width: '100%'
                                    }}
                                >
                                    Clear Suggestions
                                </button>
                                {suggestedPlaces.map((place, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            background: 'white',
                                            border: '1px solid #ddd',
                                            borderRadius: 4,
                                            marginBottom: 8,
                                            padding: 10,
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handlePanToMarker(place)}
                                    >
                                        <div style={{ fontWeight: 'bold', color: '#333' }}>{place.place} <span style={{ color: '#888', fontWeight: 'normal' }}>({place.city})</span></div>
                                        <div style={{ color: '#555', fontSize: 13 }}>{place.description}</div>
                                    </div>
                                ))}

                                {/* Display suggested places added to route */}
                                {suggestedPlacesInRoute.length > 0 && (
                                    <div style={{ marginTop: 20 }}>
                                        <h3 style={{ marginBottom: '10px', color: '#333', fontSize: '16px' }}>
                                            🟡 Tourist Attractions Added ({suggestedPlacesInRoute.length}):
                                        </h3>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            {suggestedPlacesInRoute.map((place, index) => (
                                                <div
                                                    key={place.id}
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '8px 12px',
                                                        backgroundColor: '#e3f2fd',
                                                        border: '1px solid #2196f3',
                                                        borderRadius: '4px',
                                                        marginBottom: '5px'
                                                    }}
                                                >
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ color: '#333', fontSize: '14px', fontWeight: 'bold' }}>
                                                            {index + 1}. {place.place}
                                                        </div>
                                                        <div style={{ color: '#666', fontSize: '12px' }}>
                                                            {place.city}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeSuggestedPlaceFromRoute(place.id)}
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
                        )}
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
