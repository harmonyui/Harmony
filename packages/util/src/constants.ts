export const WEB_URL = process.env.NODE_ENV === 'production' ? process.env.VERCEL_URL || 'https://dashboard.harmonyui.app' : 'http://localhost:3000'