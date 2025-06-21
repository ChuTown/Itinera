"use client"

import React, { useState, useMemo } from 'react'
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

export default function RequestPage() {
    const [cities, setCities] = useState('')

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
        console.log('Cities to travel to:', cities)
    }

    const handleInputChange = (e) => {
        setCities(e.target.value)
    }

    const MyComponent = useMemo(() => {
        return function MapComponent() {
            const { isLoaded } = useJsApiLoader({
                id: 'google-map-script',
                googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
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
                        <label htmlFor="cities" style={{
                            display: 'block',
                            marginBottom: '5px',
                            fontWeight: 'bold',
                            color: '#555'
                        }}>
                            Cities to visit:
                        </label>
                        <textarea
                            id="cities"
                            value={cities}
                            onChange={handleInputChange}
                            placeholder="Enter cities separated by commas (e.g., New York, London, Tokyo)"
                            style={{
                                width: '100%',
                                height: '100px',
                                padding: '10px',
                                border: '1px solid #ccc',
                                borderRadius: '4px',
                                resize: 'vertical',
                                fontFamily: 'Arial, sans-serif',
                                color: 'black'
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
                            fontSize: '14px'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                        onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
                    >
                        Submit Cities
                    </button>
                </form>
            </div>

            {/* Map Section */}
            <div style={{ flex: 1 }}>
                <MyComponent />
            </div>
        </div>
    );
}
