import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { userId, newEmail } = await req.json()

  if (!userId || !newEmail) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    email: newEmail,
    email_confirm: true, // mark as verified immediately
  })

  if (error) return NextResponse.json({ error }, { status: 400 })
  return NextResponse.json({ user: data })
}
