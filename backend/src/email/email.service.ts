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
      // ponytail: dev fallback logs to console; add Ethereal for real testing
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
      from: this.config.get<string>('SMTP_FROM') || 'noreply@corporate-underground.local',
      to,
      subject: `${companyName} — Your Verification Code`,
      html,
    });
  }
}
