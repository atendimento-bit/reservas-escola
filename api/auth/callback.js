const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth/callback` : 'http://localhost:3000/api/auth/callback'
);

module.exports = async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.redirect('/?authenticated=true');
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.redirect('/?error=authentication_failed');
  }
};
```

Salve: **Ctrl + S**

---

## **✅ Estrutura final deve estar assim:**
```
reservas-escola/
├── api/
│   ├── auth/
│   │   └── callback.js
│   ├── auth.js
│   └── calendar.js
├── src/
├── .env.local
├── package.json
└── vercel.json