import React, { useState } from 'react';

export default function CityExplorationPanel({
    city,
    onBack,
    selectedPlaces,
    onTogglePlace,
    onOptimizeDay,
}) {
    const [interests, setInterests] = useState('');
    const [suggestedPlaces, setSuggestedPlaces] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    console.log("Selected city:", city);

    const handleGetSuggestions = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/suggestPlaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ city, interests }),
            });
            const data = await response.json();
            setSuggestedPlaces(data);
        } catch (error) {
            console.error("Failed to fetch suggestions:", error);
            setSuggestedPlaces([]);
        }
        setIsLoading(false);
    };
    
    const renderPlace = (place, isSelected) => (
        <div key={place.place} className={`p-3 rounded-lg border ${isSelected ? 'border-green-500 bg-green-50' : 'bg-white border-gray-200'}`}>
            <h4 className="font-bold text-gray-800">{place.place}</h4>
            <p className="text-sm text-gray-600 mb-2">{place.description}</p>
            <button
                onClick={() => onTogglePlace(place)}
                className={`w-full py-1.5 text-sm font-semibold rounded-md ${isSelected ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
                {isSelected ? 'Remove from Route' : 'Add to Route'}
            </button>
        </div>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0">
                <button onClick={onBack} className="text-blue-600 hover:underline mb-4">&larr; Back to Route Planner</button>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Explore {city}</h3>
                <p className="text-gray-600 mb-4">Discover places based on your interests.</p>
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
                {/* Interests Input */}
                <div className="mb-4">
                    <label htmlFor="interests-input" className="block text-sm font-medium text-gray-700 mb-1">What are your interests in this city?</label>
                    <input
                        id="interests-input"
                        type="text"
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="e.g., books, anime, nature"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-500"
                    />
                </div>
                <button
                    onClick={handleGetSuggestions}
                    disabled={isLoading || !interests.trim()}
                    className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Loading...' : 'Get Suggestions'}
                </button>

                {/* Suggested Places */}
                {(suggestedPlaces.length > 0 || selectedPlaces.length > 0) && (
                    <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-800 mb-2">AI Suggestions</h4>
                        <div className="space-y-3">
                            {suggestedPlaces.map(p => renderPlace(p, selectedPlaces.some(sp => sp.place === p.place)))}
                        </div>
                    </div>
                )}
            </div>

            {selectedPlaces.length >= 2 && (
                <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200">
                    <button
                        onClick={onOptimizeDay}
                        className="w-full bg-blue-600 text-white font-bold py-2.5 px-4 rounded-md hover:bg-blue-700"
                    >
                        Optimize My Day in {city} ({selectedPlaces.length} places)
                    </button>
                </div>
            )}
        </div>
    );
} 