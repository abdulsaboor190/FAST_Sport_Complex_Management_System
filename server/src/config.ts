import 'dotenv/config';

export const config = {
  port: parseInt(process.env.PORT ?? '8080', 10),
  db: {
    url: process.env.DATABASE_URL!,
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiry: process.env.ACCESS_TOKEN_EXPIRY ?? '15m',
    refreshExpiry: process.env.REFRESH_TOKEN_EXPIRY ?? '7d',
  },
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM ?? 'noreply@fscm.fast.edu.pk',
  },
  reports: {
    // Comma-separated emails, e.g. "admin@fast.edu.pk,finance@fast.edu.pk"
    recipients: (process.env.ADMIN_REPORT_EMAILS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  },
} as const;
