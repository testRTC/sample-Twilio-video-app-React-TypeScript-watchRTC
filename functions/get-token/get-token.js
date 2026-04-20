const { getTwilioToken } = require('./get-twilio-token');

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

exports.handler = async event => {
  let identity;
  let roomName;

  if (event.httpMethod === 'POST' && event.body) {
    try {
      const parsed = JSON.parse(event.body);
      identity = parsed.user_identity ?? parsed.identity;
      roomName = parsed.room_name ?? parsed.roomName;
    } catch {
      return json(400, { error: { message: 'Invalid JSON body' } });
    }
  }

  const q = event.queryStringParameters || {};
  identity = identity ?? q.identity;
  roomName = roomName ?? q.roomName;

  if (!identity || !roomName) {
    return json(400, {
      error: { message: 'Missing identity and room (POST user_identity/room_name or ?identity=&roomName=)' },
    });
  }

  try {
    const token = await getTwilioToken({ identity, roomName });
    return json(200, { token, room_type: 'group' });
  } catch (err) {
    console.error(err);
    return json(500, { error: { message: err.message || 'Token error' } });
  }
};
