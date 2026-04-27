import { db } from '@/lib/firebaseAdmin'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, driftStatus } = body

    const userSnap = await db.collection('users').doc(userId).get()

    if (!userSnap.exists) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userSnap.data() || {}

    if (driftStatus === 'red') {
      const emailBody = `
Dear University Counseling Centre,

MindStep has detected a serious mental health concern for the following student:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STUDENT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name         : ${user.name || 'Unknown'}
University ID: ${user.uid || 'Not provided'}
Email        : ${user.email || 'Not provided'}
School       : ${user.school || 'Not provided'}
Course       : ${user.course || 'Not provided'}
Semester     : ${user.semester || 'Not provided'}
Student Type : ${user.studentType || 'Not provided'}
${user.hostel ? `Hostel       : ${user.hostel}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALERT DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status       : RED — Serious concern detected
Detected at  : ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
System       : MindStep Campus Mental Health Intelligence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECOMMENDED ACTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Please reach out to this student at your earliest convenience
to check on their wellbeing and offer support or a counseling
session if needed.

This is an automated alert from MindStep. The student has not
been told that this alert was sent. Please approach with care
and sensitivity.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

With regards,
MindStep — Campus Mental Health Intelligence System
The Neotia University · Team Ignite

This email is confidential and intended only for the
University Counseling Centre.
      `.trim()

      const { data, error } = await resend.emails.send({
        from: 'MindStep <onboarding@resend.dev>',
        to: ['ucc@tnu.in'],
        subject: `🚨 MindStep Alert — Student Needs Attention: ${user.name || 'Unknown'}`,
        text: emailBody,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#080C12;font-family:Inter,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0D1117,#111820);border:1px solid rgba(224,92,92,0.3);border-radius:16px;padding:32px;margin-bottom:20px;text-align:center;">
      <div style="width:48px;height:48px;background:rgba(224,92,92,0.15);border:1px solid rgba(224,92,92,0.4);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:24px;">🚨</span>
      </div>
      <h1 style="color:#E8EEF5;font-size:22px;margin:0 0 8px;font-weight:600;">
        Student Needs Attention
      </h1>
      <p style="color:#E05C5C;font-size:13px;margin:0;font-weight:500;letter-spacing:0.1em;text-transform:uppercase;">
        RED Alert · MindStep Intelligence System
      </p>
    </div>

    <!-- Student details -->
    <div style="background:#0D1117;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px;margin-bottom:20px;">
      <p style="color:#3A4A5E;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 16px;font-weight:600;">Student Details</p>

      ${[
        { label: 'Full Name', value: user.name || 'Unknown' },
        { label: 'University ID', value: user.uid || 'Not provided' },
        { label: 'Email', value: user.email || 'Not provided' },
        { label: 'School', value: user.school || 'Not provided' },
        { label: 'Course', value: user.course || 'Not provided' },
        { label: 'Semester', value: user.semester ? `Semester ${user.semester}` : 'Not provided' },
        { label: 'Student Type', value: user.studentType || 'Not provided' },
        ...(user.hostel ? [{ label: 'Hostel', value: user.hostel }] : []),
      ].map(item => `
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
          <span style="color:#5A6A7E;font-size:12px;">${item.label}</span>
          <span style="color:#C8D4E0;font-size:12px;font-weight:500;">${item.value}</span>
        </div>
      `).join('')}

      <div style="display:flex;justify-content:space-between;padding:10px 0;">
        <span style="color:#5A6A7E;font-size:12px;">Alert Time</span>
        <span style="color:#C8D4E0;font-size:12px;font-weight:500;">
          ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </span>
      </div>
    </div>

    <!-- Status badge -->
    <div style="background:rgba(224,92,92,0.08);border:1px solid rgba(224,92,92,0.2);border-radius:16px;padding:24px;margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <div style="width:10px;height:10px;border-radius:50%;background:#E05C5C;box-shadow:0 0 8px #E05C5C;flex-shrink:0;"></div>
        <p style="color:#E05C5C;font-size:14px;font-weight:600;margin:0;">Serious concern detected</p>
      </div>
      <p style="color:#8B9BB0;font-size:13px;line-height:1.7;margin:0;">
        MindStep has detected a consistent pattern of distress in this student's daily check-ins over multiple consecutive days. This is an automated alert — the student has <strong style="color:#C8D4E0;">not</strong> been informed that this message was sent.
      </p>
    </div>

    <!-- Recommended action -->
    <div style="background:rgba(79,195,161,0.06);border:1px solid rgba(79,195,161,0.15);border-radius:16px;padding:24px;margin-bottom:20px;">
      <p style="color:#4FC3A1;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;margin:0 0 12px;font-weight:600;">Recommended Action</p>
      <p style="color:#8B9BB0;font-size:13px;line-height:1.8;margin:0;">
        Please reach out to this student at your earliest convenience to check on their wellbeing.
        Consider offering a counseling session or a friendly check-in call.
        Approach with care and sensitivity — do not mention MindStep directly unless the student brings it up.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:20px 0;">
      <p style="color:#2A3A4E;font-size:11px;margin:0 0 4px;">
        MindStep — Campus Mental Health Intelligence System
      </p>
      <p style="color:#1E2A38;font-size:11px;margin:0;">
        The Neotia University · Team Ignite · This email is confidential
      </p>
    </div>

  </div>
</body>
</html>
        `,
      })

      if (error) {
        console.error('Email error:', error)
        return Response.json({ error: 'Failed to send alert email' }, { status: 500 })
      }

      console.log(`RED ALERT email sent for ${user.name} (${user.email}) — Email ID: ${data?.id}`)

      return Response.json({
        success: true,
        message: `Alert sent to ucc@tnu.in for ${user.name}`,
        emailId: data?.id,
      })
    }

    if (driftStatus === 'amber') {
      console.log(`AMBER ALERT for ${user.name} — monitoring, no email yet`)
      return Response.json({
        success: true,
        message: 'Amber alert logged — monitoring student',
      })
    }

    return Response.json({ success: true, message: 'No alert needed' })

  } catch (error: any) {
    console.error('Alert error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}