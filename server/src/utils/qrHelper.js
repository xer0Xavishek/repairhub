const QRCode = require('qrcode');

/**
 * Generates a formatted unique ticket number (e.g. RH-2026-8492)
 */
const generateTicketNumber = () => {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RH-${year}-${randomSuffix}`;
};

/**
 * Generates a base64 Data URL for a repair ticket QR Code
 */
const generateQRCodeDataURL = async (payload) => {
  try {
    const dataString = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
    const qrDataUrl = await QRCode.toDataURL(dataString, {
      errorCorrectionLevel: 'H',
      margin: 2,
      color: {
        dark: '#16a34a', // RepairHub Green
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error('[QR Generation Error]:', err);
    return '';
  }
};

module.exports = { generateTicketNumber, generateQRCodeDataURL };
