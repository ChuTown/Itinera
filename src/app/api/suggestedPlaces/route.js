export async function POST(req) {
  const { cities, vibe } = await req.json();
  // Return mock data for now
  return Response.json([
    { city: 'Tokyo', place: 'TeamLab Planets', description: 'Immersive digital art museum' },
    { city: 'Kyoto', place: 'Fushimi Inari Shrine', description: 'Famous red torii gates hike' }
  ]);
} 