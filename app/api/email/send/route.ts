import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      to,
      subject,
      html,
      companyId,
      claimId,
      emailType,
      recipientName,
      sentBy
    } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send the email via Resend
    const { data, error } = await resend.emails.send({
      from: 'Tessa Holdings Group <onboarding@resend.dev>', // temporary - change later when you verify a domain
      to: [to],
      subject: subject,
      html: html.replace(/\n/g, '<br>'),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log the email
    await supabase.from('email_logs').insert({
      company_id: companyId,
      claim_id: claimId || null,
      recipient_email: to,
      recipient_name: recipientName || null,
      subject_line: subject,
      body_preview: html.substring(0, 200),
      email_type: emailType || 'owner',
      email_status: 'Sent',
      sent_by: sentBy || null,
    });

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}