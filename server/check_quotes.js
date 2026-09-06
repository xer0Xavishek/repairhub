const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const RepairRequest = require('./src/models/RepairRequest');
  const Quote = require('./src/models/Quote');
  const User = require('./src/models/User');

  const requests = await RepairRequest.find({});
  const quotes = await Quote.find({});

  console.log('Total Requests:', requests.length);
  requests.forEach(r => {
    const qForR = quotes.filter(q => q.repairRequestId.toString() === r._id.toString());
    console.log(' - Ticket:', r.ticketNumber, 'Title:', r.itemTitle, 'Status:', r.status, 'Bids/Quotes:', qForR.length);
    qForR.forEach(q => console.log('     * Bid:', q.price, 'by repairer:', q.repairerId, 'status:', q.status));
  });

  await mongoose.disconnect();
}
check().catch(console.error);
