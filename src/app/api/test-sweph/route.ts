import { NextResponse } from 'next/server';
import sweph from 'sweph';

export async function GET() {
  try {
    const v = sweph.version();
    return NextResponse.json({ status: 'OK', version: v });
  } catch (err: any) {
    return NextResponse.json({ status: 'ERROR', error: err.message }, { status: 500 });
  }
}
