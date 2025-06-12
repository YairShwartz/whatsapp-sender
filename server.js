
const express = require('express');
const { Client, MessageMedia, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

let isReady = false;
let qrCodeData = null;

client.on('qr', async (qr) => {
  qrCodeData = await qrcode.toDataURL(qr);
  console.log('📱 סרוק את הברקוד בדפדפן כדי להתחבר לוואטסאפ');
});

client.on('ready', () => {
  isReady = true;
  console.log('✅ וואטסאפ מחובר!');
});

client.initialize();

app.use(fileUpload());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  if (!isReady && qrCodeData) {
    res.send(\`
      <html><body style="text-align:center; font-family:Arial">
      <h2>סרוק את הברקוד כדי להתחבר לוואטסאפ</h2>
      <img src="\${qrCodeData}" width="300"><br><br>
      <p>ברגע שתתחבר, תועבר אוטומטית <a href="/index-final-with-logo.html">לדף שליחת הודעות</a></p>
      </body></html>
    \`);
  } else if (isReady) {
    res.redirect('/index-final-with-logo.html');
  } else {
    res.send("⏳ מחכה לברקוד...");
  }
});

app.post('/send-message', async (req, res) => {
  const { phone, message } = req.body;
  const chatId = `${phone}@c.us`;

  try {
    if (req.files && req.files.file) {
      const file = req.files.file;
      const filePath = path.join(__dirname, 'uploads', file.name);
      if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
        fs.mkdirSync(path.join(__dirname, 'uploads'));
      }

      await file.mv(filePath);

      const media = MessageMedia.fromFilePath(filePath);
      await client.sendMessage(chatId, media, { caption: message });

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
  console.log(`🚀 שרת פעיל על פורט ${port}`);
});
