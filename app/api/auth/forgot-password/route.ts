import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const PLACEHOLDER_VALS = ['your-email@gmail.com', 'your-app-password', 'noreply@yourdomain.com', ''];

function isConfigured(val: string | undefined): boolean {
  return !!val && !PLACEHOLDER_VALS.includes(val.trim());
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return NextResponse.json({ message: 'If an account exists with this email, a reset link will be sent.' });
    }

    // Generate reset token and store in DB
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail }
    });

    await prisma.passwordResetToken.create({
      data: {
        token,
        email: normalizedEmail,
        expiresAt
      }
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3002';
    const resetLink = `${appUrl}/reset-password?token=${token}`;

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpFrom = process.env.SMTP_FROM || smtpUser;

    const smtpReady = isConfigured(smtpHost) && isConfigured(smtpUser) && isConfigured(smtpPass);

    if (!smtpReady) {
      console.log('\n[DEV] Password reset link:');
      console.log(resetLink);
      console.log('');
      return NextResponse.json({
        message: 'Reset link generated.',
        devLink: resetLink,
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: `"CertifyPro" <${smtpFrom}>`,
      to: normalizedEmail,
      subject: 'Reset Your CertifyPro Password',
      html: `
        <!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:32px;">
          <div style="max-width:560px;margin:0 auto;background:white;border:1px solid #ddd;padding:40px;">
            <h1 style="color:#141414;font-size:24px;margin-bottom:8px;">Password Reset</h1>
            <p style="color:#666;font-size:14px;margin-bottom:24px;">
              You requested to reset your password for <strong>${normalizedEmail}</strong>.
              Click the button below. This link expires in <strong>1 hour</strong>.
            </p>
            <a href="${resetLink}" style="display:inline-block;background:#141414;color:white;padding:14px 28px;text-decoration:none;font-weight:bold;font-size:14px;letter-spacing:1px;text-transform:uppercase;">Reset Password</a>
            <p style="color:#999;font-size:12px;margin-top:32px;">If you didn't request this, ignore this email.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
            <p style="color:#bbb;font-size:11px;">CertifyPro — Training &amp; Assessment Portal</p>
          </div>
        </body></html>
      `,
    });

    return NextResponse.json({ message: 'Reset email sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'Failed to send reset email.' }, { status: 500 });
  }
}
