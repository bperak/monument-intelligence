import { NextRequest } from 'next/server';
import { StreamingTextResponse, Message } from 'ai'; // Use StreamingTextResponse for robust piping

// Restore env var usage
const agentBackendUrl = process.env.AGENT_BACKEND_URL;
const agentApiKey = process.env.AGENT_API_KEY;

export const runtime = 'edge'; // Restore edge runtime if desired

export async function POST(req: NextRequest) {
  // Restore original proxy logic
  if (!agentBackendUrl || !agentApiKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration missing: AGENT_BACKEND_URL or AGENT_API_KEY not set.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { messages } = await req.json();
    const lastUserMessage = messages.findLast((m: { role: string }) => m.role === 'user');

    if (!lastUserMessage || !lastUserMessage.content) {
      return new Response(
        JSON.stringify({ error: 'No user message found.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const backendRequestBody = {
      message: lastUserMessage.content,
      // Add conversation_id or history if needed based on ChatRequest
    };

    const backendResponse = await fetch(`${agentBackendUrl}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentApiKey}`,
        // Accept header might vary depending on what the SDK needs, but Vercel protocol is custom
        // Let's remove explicit Accept: text/event-stream if StreamingTextResponse handles it
      },
      body: JSON.stringify(backendRequestBody),
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.text();
      console.error('FastAPI backend error:', backendResponse.status, errorBody);
      return new Response(
        JSON.stringify({ error: `Backend request failed: ${backendResponse.status}`, details: errorBody }),
        { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if the backend response indicates it's sending the Vercel AI SDK stream
    // The protocol doesn't use a standard content-type, it relies on prefixes.
    // We assume the FastAPI backend is now correctly formatting the stream.
    if (!backendResponse.body) {
        return new Response(JSON.stringify({ error: 'Backend stream body is null.' }), { status: 500 });
    }

    // Transform the backend response stream to a format that StreamingTextResponse can handle
    const transformedStream = new TransformStream();
    const writer = transformedStream.writable.getWriter();
    
    // Create a TextDecoder to handle the incoming text
    const textDecoder = new TextDecoder();
    
    // Read the backend response as a stream of events
    const reader = backendResponse.body.getReader();
    
    // Process the stream in the background
    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            await writer.close();
            break;
          }
          
          // Decode the chunk to text
          const chunk = textDecoder.decode(value, { stream: true });
          
          // Process each SSE event in the chunk
          const eventStrings = chunk.split('\n\n').filter(Boolean);
          for (const eventString of eventStrings) {
            if (eventString.startsWith('data: ')) {
              // Extract the JSON data
              const jsonString = eventString.slice(6); // Remove 'data: ' prefix
              try {
                const jsonData = JSON.parse(jsonString);
                // Check if this is our custom format with a "response" field
                if (jsonData.response) {
                  let textContent = '';
                  
                  if (jsonData.response.type === 'text_response') {
                    textContent = jsonData.response.content;
                  } else if (jsonData.response.type === 'map_focus') {
                    // Handle map_focus responses - convert to text
                    textContent = jsonData.response.text_response || 
                      `Showing ${jsonData.response.data.location_name} on the map.`;
                  } else {
                    // Handle any other response types
                    textContent = JSON.stringify(jsonData.response);
                  }
                  
                  // Write in the format expected by the Vercel AI SDK
                  const aiMessage = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: textContent
                  };
                  
                  // Write the message in the format StreamingTextResponse expects
                  await writer.write(new TextEncoder().encode(
                    `data: ${JSON.stringify(aiMessage)}\n\n`
                  ));
                } else {
                  // Pass through other data formats
                  await writer.write(value);
                }
              } catch (error) {
                console.error('Error parsing JSON:', error, jsonString);
                // Pass through the original data if parsing failed
                await writer.write(value);
              }
            } else {
              // Pass through non-data events
              await writer.write(new TextEncoder().encode(eventString + '\n\n'));
            }
          }
        }
      } catch (error) {
        console.error('Error processing stream:', error);
        await writer.abort(error);
      }
    })();
    
    // Use StreamingTextResponse to handle the transformed stream
    return new StreamingTextResponse(transformedStream.readable);

  } catch (error: any) {
    console.error('Error in Next.js API route /api/agent/chat:', error);
    let errorMessage = 'Internal server error';
    if (error.message) {
        errorMessage = error.message;
    }
    return new Response(JSON.stringify({ error: errorMessage, details: error.stack }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Remove or comment out the previous GET handler if POST is the primary method for chat.
// If GET is still needed for some initial connection, it can be kept.
// For typical chat, POSTing the message and streaming back is common.

/*
export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue('data: {\"message\": \"SSE connection established (GET)\"}\n\n');
      const intervalId = setInterval(() => {
        controller.enqueue('data: {\"ping\": \"still alive (GET)\"}\n\n');
      }, 10000);
      request.signal.onabort = () => {
        clearInterval(intervalId);
        controller.close();
      };
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
*/ 