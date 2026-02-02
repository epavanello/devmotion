import { z } from 'zod';
import { createMcpHandler } from '@vercel/mcp-adapter';
import { animationTools } from '$lib/ai/schemas.js';

const handler = createMcpHandler(
  (server) => {
    const toolEntries = Object.entries(animationTools);
    for (const [name, tool] of toolEntries) {
      server.registerTool(name, tool, (input) => {
        return {};
      });
    }

    server.tool(
      'roll_dice',
      'Rolls an N-sided die',
      { sides: z.number().int().min(2) },
      async ({ sides }) => {
        console.log({ sides });
        const value = 1 + Math.floor(Math.random() * sides);
        return {
          content: [{ type: 'text', text: `🎲 You rolled a ${value}!` }]
        };
      }
    );
  },
  {},
  {
    maxDuration: 5,
    streamableHttpEndpoint: '/mcp',
    verboseLogs: true
  }
);

export const GET = async ({ request }) => {
  return handler(request);
};

export const POST = async ({ request }) => {
  return handler(request);
};

export const DELETE = async ({ request }) => {
  return handler(request);
};
