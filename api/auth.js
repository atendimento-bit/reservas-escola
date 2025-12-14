const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth/callback` : 'http://localhost:3000/api/auth/callback'
);

module.exports = async (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  res.redirect(url);
};