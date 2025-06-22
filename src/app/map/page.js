"use client"

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from '@react-google-maps/api'
import CityList from './CityList';
import CityExplorationPanel from './CityExplorationPanel';
import usePersistentState from '../hooks/usePersistentState';

export default function RequestPage() {
    const [startPoint, setStartPoint] = usePersistentState('startPoint', '');
    const [endPoint, setEndPoint] = usePersistentState('endPoint', '');
    const [intermediateCities, setIntermediateCities] = usePersistentState('intermediateCities', []);
    const [sidebarTab, setSidebarTab] = usePersistentState('sidebarTab', 'route');
    const [selectedCity, setSelectedCity] = usePersistentState('selectedCity', null);
    const [selectedPlacesPerCity, setSelectedPlacesPerCity] = usePersistentState('selectedPlacesPerCity', {});
    
    // Non-persistent state
    const [directions, setDirections] = useState(null);
    const [cityRoutes, setCityRoutes] = useState({});
    const [isCalculating, setIsCalculating] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [mapView, setMapView] = usePersistentState('mapView', {
        center: { lat: 43.515640, lng: -80.513694 },
        zoom: 7
    });

    const allPlacesWithLabels = useMemo(() => {
        const places = [];
        Object.values(selectedPlacesPerCity).forEach(cityPlaces => {
            cityPlaces.forEach((place, index) => {
                if (place.lat && place.lng) {
                    places.push({ ...place, label: `${index + 1}` });
                }
            });
        });
        return places;
    }, [selectedPlacesPerCity]);

    const mapRef = useRef(null);
    const startAutocompleteRef = useRef(null);
    const endAutocompleteRef = useRef(null);
    const intermediateAutocompleteRef = useRef(null);
    const directionsServiceRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        libraries: ['places'],
    });
    
    const onLoad = React.useCallback(function callback(map) {
        mapRef.current = map;
        directionsServiceRef.current = new window.google.maps.DirectionsService();
    }, []);

    const onUnmount = React.useCallback(function callback(map) {
        mapRef.current = null;
    }, []);
    
    const handleMapStateChange = () => {
        if (mapRef.current) {
            const newCenter = mapRef.current.getCenter().toJSON();
            const newZoom = mapRef.current.getZoom();
            setMapView({ center: newCenter, zoom: newZoom });
        }
    };

    const calculateOptimalRoute = async () => {
        if (!startPoint.trim() || !endPoint.trim()) return;
        setIsCalculating(true);
        // Reset only non-persistent route data
        setDirections(null);
        setCityRoutes({});

        const request = {
            origin: startPoint,
            destination: endPoint,
            waypoints: intermediateCities.map(city => ({ location: city, stopover: true })),
            optimizeWaypoints: true,
            travelMode: window.google.maps.TravelMode.DRIVING
        };

        directionsServiceRef.current.route(request, (result, status) => {
            setIsCalculating(false);
            if (status === 'OK') {
                setDirections(result);
            } else {
                console.error('Directions request failed due to ' + status);
                alert('Failed to calculate route. Please check your place names.');
            }
        });
    };

    const routeCities = useMemo(() => {
        if (!directions) return [];
        return directions.routes[0].legs.map(leg => leg.end_address);
    }, [directions]);

    const handleCitySelect = (city) => {
        setSelectedCity(city);
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ 'address': city }, (results, status) => {
          if (status === 'OK' && mapRef.current) {
            const location = results[0].geometry.location;
            mapRef.current.panTo(location);
            mapRef.current.setZoom(12);
            setMapView({ center: location.toJSON(), zoom: 12 });
          } else {
            console.error('Geocode was not successful for the following reason: ' + status);
          }
        });
    };

    const handleTogglePlace = (place) => {
        const geocoder = new window.google.maps.Geocoder();
        const currentPlaces = selectedPlacesPerCity[selectedCity] || [];
        const isSelected = currentPlaces.some(p => p.place === place.place);

        if (isSelected) {
            const newPlaces = currentPlaces.filter(p => p.place !== place.place);
            setSelectedPlacesPerCity(prev => ({ ...prev, [selectedCity]: newPlaces }));
        } else {
            geocoder.geocode({ address: place.place + `, ${selectedCity}` }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    const enrichedPlace = { ...place, lat: location.lat(), lng: location.lng() };
                    setSelectedPlacesPerCity(prev => ({
                        ...prev,
                        [selectedCity]: [...(prev[selectedCity] || []), enrichedPlace],
                    }));
                } else {
                    console.error(`Geocode failed for "${place.place}": ${status}`);
                    alert(`Could not find "${place.place}" on the map. It was not added to your route.`);
                }
            });
        }
    };
    
    const handleOptimizeDayInCity = () => {
        const places = selectedPlacesPerCity[selectedCity];
        if (!places || places.length < 2) return;

        const request = {
            origin: { lat: places[0].lat, lng: places[0].lng },
            destination: { lat: places[places.length - 1].lat, lng: places[places.length - 1].lng },
            waypoints: places.slice(1, -1).map(p => ({ location: { lat: p.lat, lng: p.lng }, stopover: true })),
            travelMode: window.google.maps.TravelMode.DRIVING,
        };

        directionsServiceRef.current.route(request, (result, status) => {
            if (status === 'OK') {
                setCityRoutes(prev => ({ ...prev, [selectedCity]: result }));
            } else {
                console.error(`Directions request failed for ${selectedCity} due to ${status}`);
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim()) {
            setIntermediateCities([...intermediateCities, inputValue.trim()]);
            setInputValue('');
        }
    };

    const handleInputChange = (e) => { setInputValue(e.target.value); };
    const removeCity = (index) => { setIntermediateCities(intermediateCities.filter((_, i) => i !== index)); };

    const clearPlan = () => {
        setStartPoint('');
        setEndPoint('');
        setIntermediateCities([]);
        setDirections(null);
        setCityRoutes({});
        setSelectedPlacesPerCity({});
        setSelectedCity(null);
        setSidebarTab('route');
        setMapView({ center: { lat: 43.515640, lng: -80.513694 }, zoom: 7 });
    };
    
    useEffect(() => {
        if (isLoaded && !loadError && directionsServiceRef.current) {
            // Auto-recalculate route on load if inputs are present
            if (startPoint && endPoint && !directions) {
                calculateOptimalRoute();
            }
        }
    }, [isLoaded, loadError]);

    useEffect(() => {
        if (isLoaded && !loadError) {
            const initAutocomplete = (ref, inputId, onPlaceChanged) => {
                const input = document.getElementById(inputId);
                if (input && !ref.current) { // Prevent re-initialization
                    ref.current = new window.google.maps.places.Autocomplete(input, { types: ['(cities)'] });
                    ref.current.addListener('place_changed', () => {
                        const place = ref.current.getPlace();
                        if (place.formatted_address) {
                            onPlaceChanged(place.formatted_address);
                        }
                    });
                }
            };

            initAutocomplete(startAutocompleteRef, 'start-input', setStartPoint);
            initAutocomplete(endAutocompleteRef, 'end-input', setEndPoint);
            initAutocomplete(intermediateAutocompleteRef, 'place-input', setInputValue);
        }
    }, [isLoaded, loadError, sidebarTab]);

    if (loadError) return <div>Error loading maps</div>;
    if (!isLoaded) return <div>Loading...</div>;

    return (
        <div className="flex h-screen font-sans">
            <div className="w-96 p-6 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Travel Route Planner</h1>

                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => { setSidebarTab('route'); setSelectedCity(null); }}
                        className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm focus:outline-none ${sidebarTab === 'route' && !selectedCity ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        Route Planner
                    </button>
                    <button
                        onClick={() => setSidebarTab('places')}
                        className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm focus:outline-none ${sidebarTab === 'places' || selectedCity ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    >
                        Places
                    </button>
                </div>
                
                <div className="flex-grow overflow-y-auto">
                    {selectedCity ? (
                        <CityExplorationPanel
                            city={selectedCity}
                            onBack={() => setSelectedCity(null)}
                            selectedPlaces={selectedPlacesPerCity[selectedCity] || []}
                            onTogglePlace={handleTogglePlace}
                            onOptimizeDay={handleOptimizeDayInCity}
                        />
                    ) : sidebarTab === 'route' ? (
                        <div>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="start-input" className="block text-sm font-medium text-gray-700 mb-1">Starting Point:</label>
                                    <input id="start-input" type="text" value={startPoint} onChange={(e) => setStartPoint(e.target.value)} placeholder="Enter starting location..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500" />
                                </div>
                                <div>
                                    <label htmlFor="end-input" className="block text-sm font-medium text-gray-700 mb-1">Ending Point:</label>
                                    <input id="end-input" type="text" value={endPoint} onChange={(e) => setEndPoint(e.target.value)} placeholder="Enter destination..." className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500" />
                                </div>
                                <div>
                                    <label htmlFor="place-input" className="block text-sm font-medium text-gray-700 mb-1">Add Intermediate Stops:</label>
                                    <form onSubmit={handleSubmit} className="flex gap-2">
                                        <input id="place-input" type="text" value={inputValue} onChange={handleInputChange} placeholder="Add cities..." className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500" />
                                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">Add</button>
                                    </form>
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                <button onClick={calculateOptimalRoute} disabled={isCalculating} className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400">
                                    {isCalculating ? 'Calculating...' : 'Calculate Optimal Route'}
                                </button>
                            </div>

                            {intermediateCities.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Intermediate Stops ({intermediateCities.length}):</h3>
                                    <div className="space-y-2">
                                        {intermediateCities.map((city, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md">
                                                <span className="text-gray-800">{index + 1}. {city}</span>
                                                <button onClick={() => removeCity(index)} className="text-red-500 hover:text-red-700 text-sm font-semibold">Remove</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <p className="text-gray-600 mb-4">Calculate a route first to see cities and explore places.</p>
                             <CityList cities={routeCities} selectedPlacesPerCity={selectedPlacesPerCity} onCitySelect={handleCitySelect} />
                        </div>
                       
                    )}
                </div>

                <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200">
                    <button onClick={clearPlan} className="w-full bg-red-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-red-700">
                        Clear & Reset Plan
                    </button>
                </div>
            </div>

            <div className="flex-1">
                <GoogleMap
                    mapContainerClassName="w-full h-full"
                    center={mapView.center}
                    zoom={mapView.zoom}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onDragEnd={handleMapStateChange}
                    onZoomChanged={handleMapStateChange}
                >
                    {directions && (
                        <DirectionsRenderer
                            directions={directions}
                            options={{
                                polylineOptions: { strokeColor: '#FF0000', strokeWeight: 5 }
                            }}
                        />
                    )}
                    {Object.values(cityRoutes).map((route, index) => (
                        <DirectionsRenderer
                            key={index}
                            directions={route}
                            options={{
                                polylineOptions: { strokeColor: '#0000FF', strokeWeight: 4, strokeOpacity: 0.8 },
                                suppressMarkers: true, 
                            }}
                        />
                    ))}
                    {allPlacesWithLabels.map((place, index) => (
                        <Marker
                            key={`${place.place}-${index}`}
                            position={{ lat: place.lat, lng: place.lng }}
                            label={place.label}
                            title={place.place}
                        />
                    ))}
                </GoogleMap>
            </div>
        </div>
    );
}
