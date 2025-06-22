import OpenAI from 'openai';

export async function POST(req) {
  const { cities, vibe } = await req.json();

  const openai = new OpenAI({
    apiKey: process.env.NEXT_OPEN_AI_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          "role": "system",
          "content": "You are a travel assistant. Given a list of cities and a vibe, suggest one interesting place to visit in each city that matches the vibe. The response should be a JSON object with a single key 'suggestions' which is an array of objects. Each object in the array should have 'city', 'place', and 'description' keys. For example: {\"suggestions\": [{\"city\": \"Paris\", \"place\": \"Louvre Museum\", \"description\": \"World-famous art museum\"}]}"
        },
        {
          "role": "user",
          "content": `Cities: ${cities.join(', ')}. Vibe: ${vibe}`
        },
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return Response.json(result.suggestions || []);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return Response.json({ error: 'Failed to get suggestions from OpenAI.' }, { status: 500 });
  }
}