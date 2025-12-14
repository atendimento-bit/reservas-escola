const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/api/auth/callback` : 'http://localhost:3000/api/auth/callback'
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method } = req;
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    if (method === 'GET') {
      const { date } = req.query;
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const response = await calendar.events.list({
        calendarId,
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      });

      return res.status(200).json(response.data.items || []);
    }

    if (method === 'POST') {
      const { space, date, time, duration, turma, materia, observacoes, teacher } = req.body;

      const [hours, minutes] = time.split(':');
      const startDateTime = new Date(date);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(startDateTime.getHours() + parseInt(duration));

      const event = {
        summary: `${space} - ${turma} - ${materia}`,
        description: `Professor: ${teacher}\nTurma: ${turma}\nMatéria: ${materia}\n${observacoes ? `Observações: ${observacoes}` : ''}`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: 'America/Sao_Paulo',
        },
        location: space,
        colorId: '9'
      };

      const response = await calendar.events.insert({
        calendarId,
        resource: event
      });

      return res.status(201).json(response.data);
    }

    if (method === 'DELETE') {
      const { eventId } = req.query;

      await calendar.events.delete({
        calendarId,
        eventId
      });

      return res.status(200).json({ message: 'Reserva cancelada' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Erro na API:', error);
    return res.status(500).json({ error: error.message });
  }
};