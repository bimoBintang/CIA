import { Resend } from 'resend';

// Lazy initialization of Resend
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    if (!resendClient) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
}

export interface SendOTPOptions {
    email: string;
    name: string;
    otp: string;
}

export async function sendOTPEmail({ email, name, otp }: SendOTPOptions): Promise<boolean> {
    try {
        const resend = getResendClient();

        // Check if Resend is configured
        if (!resend) {
            console.log(`[EMAIL] Resend not configured. OTP for ${email}: ${otp}`);
            return true;
        }

        const { error } = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'Circle CIA <onboarding@resend.dev>',
            to: email,
            subject: '🔐 Kode Verifikasi Login - Circle CIA',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
                    <div style="max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #18181b 0%, #09090b 100%); border-radius: 16px; border: 1px solid #27272a; overflow: hidden;">
                        <!-- Header -->
                        <div style="background: linear-gradient(135deg, #22c55e 0%, #10b981 100%); padding: 30px; text-align: center;">
                            <h1 style="color: #000; margin: 0; font-size: 28px; font-weight: bold;">Circle CIA</h1>
                            <p style="color: #065f46; margin: 5px 0 0 0; font-size: 14px;">Command Center</p>
                        </div>
                        
                        <!-- Content -->
                        <div style="padding: 40px 30px;">
                            <p style="color: #a1a1aa; margin: 0 0 20px 0; font-size: 16px;">
                                Halo <strong style="color: #ffffff;">${name}</strong>,
                            </p>
                            <p style="color: #a1a1aa; margin: 0 0 30px 0; font-size: 16px;">
                                Gunakan kode verifikasi berikut untuk menyelesaikan proses login Anda:
                            </p>
                            
                            <!-- OTP Box -->
                            <div style="background: #27272a; border-radius: 12px; padding: 25px; text-align: center; margin: 0 0 30px 0;">
                                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: bold; color: #22c55e; letter-spacing: 8px;">
                                    ${otp}
                                </span>
                            </div>
                            
                            <!-- Warning -->
                            <div style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); border-radius: 8px; padding: 15px; margin: 0 0 30px 0;">
                                <p style="color: #eab308; margin: 0; font-size: 14px;">
                                    ⚠️ Kode ini berlaku selama <strong>5 menit</strong>. Jangan bagikan kode ini kepada siapapun.
                                </p>
                            </div>
                            
                            <p style="color: #71717a; margin: 0; font-size: 14px;">
                                Jika Anda tidak mencoba login, abaikan email ini atau hubungi administrator.
                            </p>
                        </div>
                        
                        <!-- Footer -->
                        <div style="padding: 20px 30px; border-top: 1px solid #27272a; text-align: center;">
                            <p style="color: #52525b; margin: 0; font-size: 12px;">
                                © ${new Date().getFullYear()} Circle CIA Security System
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `Circle CIA - Kode Verifikasi Login\n\nHalo ${name},\n\nKode verifikasi Anda: ${otp}\n\nKode ini berlaku selama 5 menit. Jangan bagikan kode ini kepada siapapun.\n\nJika Anda tidak mencoba login, abaikan email ini.`,
        });

        if (error) {
            console.error('[EMAIL] Failed to send OTP via Resend:', error);
            return false;
        }

        console.log(`[EMAIL] OTP sent to ${email} via Resend`);
        return true;
    } catch (error) {
        console.error('[EMAIL] Failed to send OTP:', error);
        return false;
    }
}

// Generate 6-digit OTP
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// OTP expiry time (5 minutes)
export function getOTPExpiry(): Date {
    return new Date(Date.now() + 5 * 60 * 1000);
}
