import { NextRequest, NextResponse } from "next/server"
import { EmailService } from "@/lib/services/email-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, inviterName, businessName, role, invitationToken } = body

    // Validate required fields
    if (!to || !inviterName || !businessName || !role || !invitationToken) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Send email
    const result = await EmailService.sendTeamInvitation({
      to,
      inviterName,
      businessName,
      role,
      invitationToken,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("Error sending invitation email:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send email"
      },
      { status: 500 }
    )
  }
}
