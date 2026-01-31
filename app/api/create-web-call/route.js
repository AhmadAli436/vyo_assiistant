import Retell from 'retell-sdk';
import { NextResponse } from 'next/server';

const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID;

export async function POST() {
  if (!RETELL_API_KEY || !RETELL_AGENT_ID) {
    return NextResponse.json(
      { error: 'Missing RETELL_API_KEY or RETELL_AGENT_ID' },
      { status: 500 }
    );
  }

  try {
    const client = new Retell({ apiKey: RETELL_API_KEY });
    const webCallResponse = await client.call.createWebCall({
      agent_id: RETELL_AGENT_ID,
    });
    return NextResponse.json({
      access_token: webCallResponse.access_token,
      call_id: webCallResponse.call_id,
    });
  } catch (err) {
    console.error('Retell createWebCall error:', err);
    return NextResponse.json(
      { error: err?.message ?? 'Failed to create web call' },
      { status: err?.status ?? 500 }
    );
  }
}
