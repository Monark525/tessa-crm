import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { supabase } from '@/lib/supabase';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// Standard wholesale price per phone number per month (e.g., $2.00)
const PHONE_NUMBER_PRICE = 2.00;

// GET: Search available phone numbers by Area Code
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const areaCode = searchParams.get('areaCode');

    if (!areaCode || areaCode.length !== 3) {
      return NextResponse.json({ error: 'Please provide a valid 3-digit area code.' }, { status: 400 });
    }

    // Search Twilio's available local numbers
    const availableNumbers = await client.availablePhoneNumbers('US').local.list({
      areaCode: parseInt(areaCode, 10),
      limit: 10
    });

    const formattedNumbers = availableNumbers.map(num => ({
      phoneNumber: num.phoneNumber,
      friendlyName: num.friendlyName,
      locality: num.locality,
      region: num.region
    }));

    return NextResponse.json({ numbers: formattedNumbers, price: PHONE_NUMBER_PRICE });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Buy Phone Number & Deduct Wallet
export async function POST(request: Request) {
  try {
    const { companyId, phoneNumber, friendlyName } = await request.json();

    if (!companyId || !phoneNumber) {
      return NextResponse.json({ error: 'Missing companyId or phoneNumber.' }, { status: 400 });
    }

    // 1. Fetch Company Wallet Balance
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('wallet_balance, twilio_subaccount_sid')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: 'Company account not found.' }, { status: 404 });
    }

    const currentBalance = Number(company.wallet_balance) || 0;

    // 2. Enforce Financial Gatekeeper: Ensure sufficient balance
    if (currentBalance < PHONE_NUMBER_PRICE) {
      return NextResponse.json({
        error: `Insufficient wallet balance. You have $${currentBalance.toFixed(2)}, but buying a number requires $${PHONE_NUMBER_PRICE.toFixed(2)}. Please top up your wallet.`
      }, { status: 400 });
    }

    // 3. Purchase Number via Twilio
    // Point the new number directly to your deployed Twilio Function
    const voiceUrl = `https://${process.env.TWILIO_SIP_DOMAIN || ''}`; // Replace or let function router handle default TwiML App

    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber: phoneNumber,
      friendlyName: friendlyName || `Tessa Line (${phoneNumber})`
    });

    // 4. Deduct funds from Wallet
    const newBalance = currentBalance - PHONE_NUMBER_PRICE;
    await supabase
      .from('companies')
      .update({ wallet_balance: newBalance })
      .eq('id', companyId);

    // 5. Store Number in Database Linked to Company
    const { data: insertedNumber, error: insertError } = await supabase
      .from('company_phone_numbers')
      .insert({
        company_id: companyId,
        phone_number: purchasedNumber.phoneNumber,
        friendly_name: friendlyName || purchasedNumber.friendlyName,
        twilio_sid: purchasedNumber.sid
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      success: true,
      message: 'Phone number purchased successfully!',
      number: insertedNumber,
      newWalletBalance: newBalance
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}