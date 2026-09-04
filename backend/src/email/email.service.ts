import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    const port = config.get<number>('SMTP_PORT') || 587;
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  async sendOtp(to: string, otp: string, companyName: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>${companyName} — Verification Code</h2>
        <p>Your one-time code:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 16px; background: #f4f4f4; text-align: center;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px;">Expires in 15 minutes. Do not share this code.</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM') || 'noreply@underground.diama.dev',
      to,
      subject: `${companyName} — Your Verification Code`,
      html,
    });
  }

  async sendPasswordReset(to: string, resetLink: string) {
    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
        <h2>Corporate Underground — Reset Password</h2>
        <p>Kami menerima permintaan untuk mereset kata sandi akunmu.</p>
        <p>Klik tombol atau tautan di bawah ini untuk mengatur kata sandi baru (berlaku selama 1 jam):</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${resetLink}" style="background: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #666; font-size: 13px; word-break: break-all;">
          Atau salin tautan berikut ke browsermu:<br/>
          <a href="${resetLink}">${resetLink}</a>
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">
          Jika kamu tidak meminta reset password, abaikan email ini dengan aman.
        </p>
      </div>
    `;

    await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM') || 'noreply@underground.diama.dev',
      to,
      subject: `Corporate Underground — Link Reset Password`,
      html,
    });
  }
}
