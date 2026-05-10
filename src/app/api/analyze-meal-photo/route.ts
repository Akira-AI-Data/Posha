import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { buildMealPhotoPrompt, parseMealPhotoAnalysis } from '@/lib/mealPhoto';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new NextResponse('AI features are not configured on this deployment.', { status: 503 });
    }

    const body = (await req.json()) as {
      image?: { type: string; content: string; name?: string };
    };

    if (!body.image?.type?.startsWith('image/') || !body.image.content) {
      return new NextResponse('Image is required.', { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: body.image.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: body.image.content,
              },
            },
            {
              type: 'text',
              text: buildMealPhotoPrompt(),
            },
          ],
        },
      ],
    });

    const text = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n');

    const analysis = parseMealPhotoAnalysis(text);
    if (!analysis) {
      return NextResponse.json(
        { error: 'Could not confidently parse meal analysis from AI response.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('Meal photo analysis error:', error);
    return new NextResponse(error instanceof Error ? error.message : 'Internal server error', {
      status: 500,
    });
  }
}
