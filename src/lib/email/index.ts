// src/lib/email/index.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "TimeFlow <noreply@timeflow.app>",
    to,
    subject,
    html: wrapTemplate(html),
  });
}

function wrapTemplate(body: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: 'DM Sans', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 28px 32px; color: white; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
    .body { padding: 28px 32px; color: #334155; font-size: 15px; line-height: 1.6; }
    .footer { padding: 16px 32px; background: #f1f5f9; color: #94a3b8; font-size: 12px; text-align: center; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 700; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>⚡ TimeFlow</h1></div>
    <div class="body">${body}</div>
    <div class="footer">You're receiving this because you enabled email reminders in TimeFlow.<br/>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#6366f1">Manage preferences</a></div>
  </div>
</body>
</html>`;
}
