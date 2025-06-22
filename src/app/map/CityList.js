export default function CityList({ cities, selectedPlacesPerCity, onCitySelect }) {
    if (!cities || cities.length === 0) {
        return null;
    }

    return (
        <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Cities on Route</h3>
            <div className="space-y-2">
                {cities.map((city, index) => (
                    <button
                        key={index}
                        onClick={() => onCitySelect(city)}
                        className="w-full text-left px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex justify-between items-center"
                    >
                        <span className="text-gray-900 font-medium">{city}</span>
                        <span className="text-sm font-medium text-blue-600 bg-blue-100 rounded-full px-2 py-0.5">
                            {selectedPlacesPerCity[city]?.length || 0} places
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
} 