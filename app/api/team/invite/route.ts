import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim();

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: Missing session token.' }, { status: 401 });
    }

    const { email, role } = await req.json();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanRole = ['agent', 'manager', 'admin'].includes(role) ? role : 'agent';

    if (!cleanEmail) {
      return NextResponse.json({ error: 'Recipient email is required.' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Verify the caller's identity from their JWT token (never trust companyId from client body)
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !caller) {
      return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
    }

    // 2. Fetch the caller's profile to enforce their exact company_id and verify Admin/Owner permissions
    const { data: callerProfile, error: callerProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, company_id, role')
      .eq('id', caller.id)
      .single();

    if (callerProfileError || !callerProfile?.company_id) {
      return NextResponse.json({ error: 'Caller company profile not found.' }, { status: 403 });
    }

    if (callerProfile.role === 'agent') {
      return NextResponse.json({ error: 'Only Admins or Managers can invite team members.' }, { status: 403 });
    }

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://tessa-crm-one.vercel.app';

    // 3. Send Supabase Auth invite email redirecting to /accept-invite
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      cleanEmail,
      {
        data: {
          company_id: callerProfile.company_id,
          role: cleanRole,
        },
        redirectTo: `${origin}/accept-invite`,
      }
    );

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    // 4. Pre-link the invited user in public.profiles under the Admin's company_id
    if (inviteData?.user) {
      const { error: profileUpsertError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: inviteData.user.id,
          company_id: callerProfile.company_id,
          role: cleanRole,
          full_name: cleanEmail.split('@')[0],
        });

      if (profileUpsertError) {
        return NextResponse.json({ error: profileUpsertError.message }, { status: 400 });
      }
    }

    // 5. Record the invitation in public.company_invitations matching your exact table schema
    const { error: invitationInsertError } = await supabaseAdmin
      .from('company_invitations')
      .insert({
        company_id: callerProfile.company_id,
        email: cleanEmail,
        role: cleanRole,
        invited_by: callerProfile.id,
        status: 'pending',
      });

    if (invitationInsertError) {
      return NextResponse.json({ error: invitationInsertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to send invitation.' },
      { status: 500 }
    );
  }
}