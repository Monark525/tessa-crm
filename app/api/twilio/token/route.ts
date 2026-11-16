import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function GET(request: Request) {
  try {
    const AccessToken = twilio.jwt.AccessToken;
    const VoiceGrant = AccessToken.VoiceGrant;

    // Pull secure credentials from .env.local
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioApiKey = process.env.TWILIO_API_KEY;
    const twilioApiSecret = process.env.TWILIO_API_SECRET;
    const twilioTwimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (!twilioAccountSid || !twilioApiKey || !twilioApiSecret || !twilioTwimlAppSid) {
      return NextResponse.json(
        { error: 'Missing Twilio Voice configuration in environment variables.' }, 
        { status: 500 }
      );
    }

    // Generate a unique digital identity for the agent's browser session
    const identity = 'tessa_agent_' + Math.random().toString(36).substring(7);

    // Create the Voice Grant explicitly tying the browser to your Twilio App
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twilioTwimlAppSid,
      incomingAllow: false, // Outbound dialer only for now
    });

    // Sign the token
    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKey,
      twilioApiSecret,
      { identity }
    );
    
    token.addGrant(voiceGrant);

    return NextResponse.json({ token: token.toJwt(), identity });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}