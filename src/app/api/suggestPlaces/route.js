import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_OPEN_AI_KEY,
});

export async function POST(req) {
    const { city, interests } = await req.json();

    if (!city || !interests) {
        return new Response(JSON.stringify({ error: 'City and interests are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const prompt = `Recommend 3 unique places to visit in ${city} for someone interested in: ${interests}. Return a valid JSON object with a single key "suggestions", which contains an array of objects. Each object in the array should have two keys: "place" (the name of the location) and "description" (a short, compelling description of max 15 words).`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            response_format: { type: "json_object" },
        });

        const content = response.choices[0].message.content;
        const parsedData = JSON.parse(content);
        
        if (parsedData.suggestions && Array.isArray(parsedData.suggestions)) {
            return new Response(JSON.stringify(parsedData.suggestions), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        } else {
            console.error("OpenAI response did not match the expected format:", content);
            return new Response(JSON.stringify([]), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        return new Response(JSON.stringify([]), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
} 