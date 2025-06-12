
const express = require('express');
const { Client, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

const client = new Client();
client.initialize();

client.on('qr', qr => {
  console.log('📱 סרוק את הקוד הבא עם וואטסאפ:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ וואטסאפ מחובר!');
});

app.use(express.static(__dirname));
app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));

app.post('/send-message', async (req, res) => {
  const { phone, message } = req.body;
  const chatId = `${phone}@c.us`;

  try {
    if (req.files && req.files.file) {
      const file = req.files.file;
      const filePath = path.join(__dirname, 'uploads', file.name);

      // ודא שהתיקייה קיימת
      if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads'));
      }

      await file.mv(filePath);

      const media = MessageMedia.fromFilePath(filePath);
      await client.sendMessage(chatId, media, { caption: message });

      // מחק את הקובץ לאחר השליחה
      fs.unlinkSync(filePath);
    } else {
      await client.sendMessage(chatId, message);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('שגיאה בשליחה:', error);
    res.json({ success: false });
  }
});

app.listen(port, () => {
  console.log(`🚀 שרת פעיל ב- http://localhost:${port}`);
});
