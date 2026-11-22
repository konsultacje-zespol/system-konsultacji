import { config } from '../src/config.js';
import { logger } from '../src/logger.js';
import { sampleBookingEmailData } from '../src/notifications/booking-email-data.js';
import { bookingConfirmedEmail } from '../src/notifications/email-texts.js';
import { sendMail } from '../src/notifications/mail.js';

// Sends one example confirmation e-mail. Check it in Mailpit: http://localhost:8025
const { subject, text } = bookingConfirmedEmail(sampleBookingEmailData, config.APP_URL);

await sendMail({ to: 'test@example.com', subject, text });

logger.info('Testowy e-mail wysłany — sprawdź Mailpit: http://localhost:8025');
