require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const RepairRequest = require('../models/RepairRequest');
const Quote = require('../models/Quote');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const RepairCafeEvent = require('../models/RepairCafeEvent');
const CommunityPost = require('../models/CommunityPost');
const Guide = require('../models/Guide');
const ItemHistoryLog = require('../models/ItemHistoryLog');
const { generateTicketNumber, generateQRCodeDataURL } = require('./qrHelper');

const seedDatabase = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const connUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/repairhub';
      await mongoose.connect(connUri);
      console.log('[Seed] Connected to MongoDB');
    }

    // 1. Wipe old collections for clean, fresh state
    await User.deleteMany({});
    await RepairRequest.deleteMany({});
    await Quote.deleteMany({});
    await Review.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await RepairCafeEvent.deleteMany({});
    await CommunityPost.deleteMany({});
    await Guide.deleteMany({});
    await ItemHistoryLog.deleteMany({});

    console.log('[Seed] Cleared existing records across all collections.');

    // 2. Seed Customer / Faculty Accounts
    const avishek = await User.create({
      name: 'Avishek Biswas',
      email: 'avishek@bracu.ac.bd',
      passwordHash: 'password123',
      role: 'requester',
      phone: '+8801711000001',
      address: 'Mohakhali Wireless Gate, Dhaka',
      location: { type: 'Point', coordinates: [90.4071, 23.7772], address: 'Mohakhali, Dhaka' },
    });

    const profTanvir = await User.create({
      name: 'Dr. Tanvir Hossain',
      email: 'tanvir.prof@bracu.ac.bd',
      passwordHash: 'password123',
      role: 'requester',
      phone: '+8801711000010',
      address: 'Road 11, Block D, Banani, Dhaka',
      location: { type: 'Point', coordinates: [90.4042, 23.7931], address: 'Banani, Dhaka' },
    });

    const samira = await User.create({
      name: 'Samira Chowdhury',
      email: 'samira.c@gmail.com',
      passwordHash: 'password123',
      role: 'requester',
      phone: '+8801711000020',
      address: 'Road 8A, Dhanmondi R/A, Dhaka',
      location: { type: 'Point', coordinates: [90.3752, 23.7465], address: 'Dhanmondi, Dhaka' },
    });

    // Admin Account
    const adminUser = await User.create({
      name: 'CSE470 Platform Admin',
      email: 'admin@repairhub.com',
      passwordHash: 'admin123',
      role: 'admin',
      phone: '+8801511000000',
      address: 'BRAC University CSE Dept, Merul Badda, Dhaka',
      location: { type: 'Point', coordinates: [90.4255, 23.7712], address: 'Merul Badda, Dhaka' },
    });

    // 3. Seed 15 Verified Repairers (10 Physical Workshops + 5 Freelancer Fixers in Dhaka)
    const repairersData = [
      // --- 10 Physical Verified Workshops ---
      {
        name: 'Master Rafiqul Islam',
        email: 'rafiq@repairhub.com',
        businessName: 'Rafiq Precision Tech & Electronics',
        categories: ['Electronics', 'Home Appliances'],
        technicianType: 'workshop',
        priceRangeMin: 300,
        priceRangeMax: 2500,
        phone: '+8801811000002',
        address: 'Plot 14, Bir Uttam Mir Shawkat Sarak, Gulshan 1, Dhaka',
        coordinates: [90.4174, 23.7808],
      },
      {
        name: 'Dhaka Bike Doctor (Tanvir)',
        email: 'bikedoctor@repairhub.com',
        businessName: 'Dhaka Cycle & Gear Hub',
        categories: ['Bicycles', 'Mechanical'],
        technicianType: 'workshop',
        priceRangeMin: 200,
        priceRangeMax: 1500,
        phone: '+8801911000003',
        address: 'House 42, Road 11, Block C, Banani, Dhaka',
        coordinates: [90.4039, 23.7937],
      },
      {
        name: 'Engr. Farhan Kabir',
        email: 'farhan.laptop@repairhub.com',
        businessName: 'Elephant Road Mac & Laptop Clinic',
        categories: ['Electronics'],
        technicianType: 'workshop',
        priceRangeMin: 500,
        priceRangeMax: 6000,
        phone: '+8801712000004',
        address: 'Level 4, Multiplan Center, New Elephant Road, Dhaka',
        coordinates: [90.3868, 23.7388],
      },
      {
        name: 'Shafiul Alam',
        email: 'stadium.optics@repairhub.com',
        businessName: 'Stadium Camera & Optical Restorations',
        categories: ['Electronics', 'Mechanical'],
        technicianType: 'workshop',
        priceRangeMin: 400,
        priceRangeMax: 4500,
        phone: '+8801812000005',
        address: 'Shop 18, National Stadium Market, Baitul Mukarram, Dhaka',
        coordinates: [90.4128, 23.7295],
      },
      {
        name: 'Kamrul Hasan',
        email: 'dhanmondi.audio@repairhub.com',
        businessName: 'Dhanmondi Sound & Hi-Fi Audio Lab',
        categories: ['Electronics'],
        technicianType: 'workshop',
        priceRangeMin: 350,
        priceRangeMax: 3500,
        phone: '+8801912000006',
        address: 'House 16/A, Road 27 (Old), Dhanmondi, Dhaka',
        coordinates: [90.3755, 23.7538],
      },
      {
        name: 'Abdul Hannan',
        email: 'uttara.green@repairhub.com',
        businessName: 'Uttara Green Motor & Microwave Works',
        categories: ['Home Appliances', 'Electronics'],
        technicianType: 'workshop',
        priceRangeMin: 300,
        priceRangeMax: 2800,
        phone: '+8801612000007',
        address: 'Sector 7, Rabindra Sarani, Uttara, Dhaka',
        coordinates: [90.3985, 23.8692],
      },
      {
        name: 'Md. Moniruzzaman',
        email: 'mirpur.appliance@repairhub.com',
        businessName: 'Mirpur-10 Thermal & Appliance Care',
        categories: ['Home Appliances', 'Mechanical'],
        technicianType: 'workshop',
        priceRangeMin: 250,
        priceRangeMax: 3200,
        phone: '+8801713000008',
        address: 'Mirpur 10 Roundabout (Opposite Fire Service), Dhaka',
        coordinates: [90.3685, 23.8071],
      },
      {
        name: 'Tariqul Islam',
        email: 'motijheel.printers@repairhub.com',
        businessName: 'Motijheel Office Gear & Printer Pro',
        categories: ['Electronics', 'Mechanical'],
        technicianType: 'workshop',
        priceRangeMin: 400,
        priceRangeMax: 3800,
        phone: '+8801813000009',
        address: 'City Center Bhaban, Dilkusha C/A, Motijheel, Dhaka',
        coordinates: [90.4182, 23.7312],
      },
      {
        name: 'Ustad Naziruddin',
        email: 'heritage.clocks@repairhub.com',
        businessName: 'Old Dhaka Heritage Clock & Precision Gearworks',
        categories: ['Mechanical', 'Furniture'],
        technicianType: 'workshop',
        priceRangeMin: 300,
        priceRangeMax: 4000,
        phone: '+8801913000010',
        address: 'Chowk Circular Road, Lalbagh, Old Dhaka',
        coordinates: [90.3881, 23.7198],
      },
      {
        name: 'Sakib Rahman',
        email: 'panthapath.tech@repairhub.com',
        businessName: 'Panthapath Smart Device & Logic Lab',
        categories: ['Electronics'],
        technicianType: 'workshop',
        priceRangeMin: 300,
        priceRangeMax: 5000,
        phone: '+8801613000011',
        address: 'Green Road Junction, Panthapath, Dhaka',
        coordinates: [90.3872, 23.7519],
      },

      // --- 5 Doorstep / Mobile Freelance Technicians ---
      {
        name: 'Sultana Razia',
        email: 'sultana.textile@repairhub.com',
        businessName: 'Sultana Razia - Sustainable Textile & Garment Restorer',
        categories: ['Textiles & Clothing', 'Furniture'],
        technicianType: 'freelance',
        priceRangeMin: 200,
        priceRangeMax: 1800,
        phone: '+8801714000012',
        address: 'Mohakhali TB Gate, Dhaka',
        coordinates: [90.4012, 23.7785],
      },
      {
        name: 'Arif Hossain',
        email: 'arif.circuits@repairhub.com',
        businessName: 'Arif Hossain - Doorstep Drone & RC Circuit Tinkerer',
        categories: ['Electronics', 'Mechanical'],
        technicianType: 'freelance',
        priceRangeMin: 350,
        priceRangeMax: 3000,
        phone: '+8801814000013',
        address: 'Kha-Pragati Sarani, Merul Badda, Dhaka',
        coordinates: [90.4262, 23.7695],
      },
      {
        name: 'Mehedi Hasan',
        email: 'mehedi.ebike@repairhub.com',
        businessName: 'Mehedi Hasan - Electric Bike & Lithium Battery Specialist',
        categories: ['Bicycles', 'Electronics'],
        technicianType: 'freelance',
        priceRangeMin: 250,
        priceRangeMax: 3500,
        phone: '+8801914000014',
        address: 'Hatirjheel West Rampura Bridge, Dhaka',
        coordinates: [90.4195, 23.7612],
      },
      {
        name: 'Engr. Nusrat Jahan',
        email: 'nusrat.iot@repairhub.com',
        businessName: 'Nusrat Jahan - Smart Home & IoT Sensor Troubleshooter',
        categories: ['Electronics', 'Home Appliances'],
        technicianType: 'freelance',
        priceRangeMin: 400,
        priceRangeMax: 4000,
        phone: '+8801614000015',
        address: 'Block C, Road 5, Bashundhara R/A, Dhaka',
        coordinates: [90.4312, 23.8165],
      },
      {
        name: 'Zubair Ahmed',
        email: 'zubair.retro@repairhub.com',
        businessName: 'Zubair Ahmed - Vintage Gaming & Retro Electronics Modder',
        categories: ['Electronics'],
        technicianType: 'freelance',
        priceRangeMin: 300,
        priceRangeMax: 2500,
        phone: '+8801715000016',
        address: 'Taltola Market Lane, Khilgaon, Dhaka',
        coordinates: [90.4221, 23.7521],
      },
    ];

    const repairers = [];
    for (const rData of repairersData) {
      const u = await User.create({
        name: rData.name,
        email: rData.email,
        passwordHash: 'password123',
        role: 'repairer',
        businessName: rData.businessName,
        categories: rData.categories,
        technicianType: rData.technicianType,
        priceRangeMin: rData.priceRangeMin,
        priceRangeMax: rData.priceRangeMax,
        rating: 0,
        ratingCount: 0,
        isVerified: true,
        phone: rData.phone,
        address: rData.address,
        location: {
          type: 'Point',
          coordinates: rData.coordinates,
          address: rData.address,
        },
      });
      repairers.push(u);
    }

    console.log(`[Seed] Created ${repairers.length} verified repairer profiles (10 workshops, 5 freelancers).`);

    // Helper map for quick access
    const repMap = {};
    repairers.forEach(r => { repMap[r.email] = r; });

    // 4. Create 10 Real-Life Dhaka Repair Requests Across the Full Lifecycle
    const sampleTickets = [];

    // Ticket 1: COMPLETED (Microwave arcing) -> Master Rafiq
    const t1 = generateTicketNumber();
    const qr1 = await generateQRCodeDataURL({ ticketNumber: t1, requesterId: avishek._id });
    const req1 = await RepairRequest.create({
      ticketNumber: t1,
      requesterId: avishek._id,
      assignedRepairerId: repMap['rafiq@repairhub.com']._id,
      itemTitle: 'Samsung Smart Inverter Microwave Oven (28L)',
      itemDescription: 'Sparks violently from the right cavity wall when starting. Food does not heat properly.',
      category: 'Home Appliances',
      subCategory: 'Microwave',
      photos: ['https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800'],
      issueDescription: 'Burnt waveguide mica sheet causing electrical arcing inside cooking chamber.',
      preferredMethod: 'drop-off',
      status: 'Completed',
      estimatedPrice: 750,
      finalPrice: 750,
      dropoffVerified: true,
      pickupVerified: true,
      qrCode: qr1,
      location: { type: 'Point', coordinates: [90.4071, 23.7772], address: 'Mohakhali, Dhaka' },
    });
    sampleTickets.push(req1);

    // Quote 1 & Review 1 for Ticket 1
    const q1 = await Quote.create({
      repairRequestId: req1._id,
      repairerId: repMap['rafiq@repairhub.com']._id,
      price: 750,
      estimatedDays: 1,
      message: 'Replaced charred waveguide cover with high-temp mica sheet, cleaned magnetron probe, tested radiation safety.',
      status: 'Accepted',
    });
    await Payment.create({
      repairRequestId: req1._id,
      quoteId: q1._id,
      payerId: avishek._id,
      payeeId: repMap['rafiq@repairhub.com']._id,
      amount: 750,
      platformFee: 37.5,
      method: 'bKash',
      transactionId: `TRX-${Date.now()}-01`,
      status: 'Successful',
      escrowStatus: 'RELEASED_TO_REPAIRER',
      releasedAt: new Date(),
    });
    await Review.create({
      repairRequestId: req1._id,
      repairerId: repMap['rafiq@repairhub.com']._id,
      requesterId: avishek._id,
      qualityRating: 5,
      communicationRating: 5,
      turnaroundRating: 5,
      comment: 'Fixed my Samsung microwave arcing fault within 24 hours. Excellent craftsmanship and genuine advice.',
    });

    // Ticket 2: COMPLETED (MacBook battery & liquid spill) -> Elephant Road Mac Clinic
    const t2 = generateTicketNumber();
    const qr2 = await generateQRCodeDataURL({ ticketNumber: t2, requesterId: profTanvir._id });
    const req2 = await RepairRequest.create({
      ticketNumber: t2,
      requesterId: profTanvir._id,
      assignedRepairerId: repMap['farhan.laptop@repairhub.com']._id,
      itemTitle: 'Apple MacBook Air M1 (Liquid Damage & Battery Replacement)',
      itemDescription: 'Spilled tea over trackpad. Trackpad clicks unresponsive and battery warning shows Service Recommended.',
      category: 'Electronics',
      subCategory: 'Laptops',
      photos: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'],
      issueDescription: 'Liquid corrosion on audio board and trackpad flex cable; battery cell cycle count 840 with swelling.',
      preferredMethod: 'drop-off',
      status: 'Completed',
      estimatedPrice: 3200,
      finalPrice: 3200,
      dropoffVerified: true,
      pickupVerified: true,
      qrCode: qr2,
      location: { type: 'Point', coordinates: [90.4042, 23.7931], address: 'Banani, Dhaka' },
    });
    sampleTickets.push(req2);

    const q2 = await Quote.create({
      repairRequestId: req2._id,
      repairerId: repMap['farhan.laptop@repairhub.com']._id,
      price: 3200,
      estimatedDays: 2,
      message: 'Ultrasonic board wash for corrosion removal, replaced genuine battery pack, calibrated force touch trackpad.',
      status: 'Accepted',
    });
    await Payment.create({
      repairRequestId: req2._id,
      quoteId: q2._id,
      payerId: profTanvir._id,
      payeeId: repMap['farhan.laptop@repairhub.com']._id,
      amount: 3200,
      platformFee: 160,
      method: 'Card',
      transactionId: `TRX-${Date.now()}-02`,
      status: 'Successful',
      escrowStatus: 'RELEASED_TO_REPAIRER',
      releasedAt: new Date(),
    });
    await Review.create({
      repairRequestId: req2._id,
      repairerId: repMap['farhan.laptop@repairhub.com']._id,
      requesterId: profTanvir._id,
      qualityRating: 5,
      communicationRating: 5,
      turnaroundRating: 4,
      comment: 'Saved over ৳40,000 compared to official board replacement. The ultrasonic cleaning was completely thorough.',
    });

    // Ticket 3: COMPLETED (Vintage camera lens fungus) -> Stadium Camera Restorations
    const t3 = generateTicketNumber();
    const qr3 = await generateQRCodeDataURL({ ticketNumber: t3, requesterId: samira._id });
    const req3 = await RepairRequest.create({
      ticketNumber: t3,
      requesterId: samira._id,
      assignedRepairerId: repMap['stadium.optics@repairhub.com']._id,
      itemTitle: 'Canon FD 50mm f/1.4 Vintage Manual Lens',
      itemDescription: 'Severe spiderweb fungus on middle glass elements. Aperture ring feels sticky at f/5.6.',
      category: 'Electronics',
      subCategory: 'Cameras',
      photos: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800'],
      issueDescription: 'Interior fungus growth due to Dhaka monsoon humidity; hardened lubrication on aperture blades.',
      preferredMethod: 'drop-off',
      status: 'Completed',
      estimatedPrice: 1400,
      finalPrice: 1400,
      dropoffVerified: true,
      pickupVerified: true,
      qrCode: qr3,
      location: { type: 'Point', coordinates: [90.3752, 23.7465], address: 'Dhanmondi, Dhaka' },
    });
    sampleTickets.push(req3);

    const q3 = await Quote.create({
      repairRequestId: req3._id,
      repairerId: repMap['stadium.optics@repairhub.com']._id,
      price: 1400,
      estimatedDays: 2,
      message: 'Full optical teardown, hydrogen peroxide & ammonia fungus disinfection, re-lubricated helicoid with synthetic grease.',
      status: 'Accepted',
    });
    await Payment.create({
      repairRequestId: req3._id,
      quoteId: q3._id,
      payerId: samira._id,
      payeeId: repMap['stadium.optics@repairhub.com']._id,
      amount: 1400,
      platformFee: 70,
      method: 'bKash',
      transactionId: `TRX-${Date.now()}-03`,
      status: 'Successful',
      escrowStatus: 'RELEASED_TO_REPAIRER',
      releasedAt: new Date(),
    });
    await Review.create({
      repairRequestId: req3._id,
      repairerId: repMap['stadium.optics@repairhub.com']._id,
      requesterId: samira._id,
      qualityRating: 5,
      communicationRating: 5,
      turnaroundRating: 5,
      comment: 'Optics look crystal clear! The vintage optical coating was preserved without any scratches.',
    });

    // Ticket 4: COMPLETED (Denim restoration) -> Sultana Razia (Freelance)
    const t4 = generateTicketNumber();
    const qr4 = await generateQRCodeDataURL({ ticketNumber: t4, requesterId: avishek._id });
    const req4 = await RepairRequest.create({
      ticketNumber: t4,
      requesterId: avishek._id,
      assignedRepairerId: repMap['sultana.textile@repairhub.com']._id,
      itemTitle: 'Vintage Levi’s Heavyweight Denim Jacket',
      itemDescription: 'Main heavy brass zipper broken; large elbow rip along the arm seam.',
      category: 'Textiles & Clothing',
      subCategory: 'Jackets',
      photos: ['https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800'],
      issueDescription: 'Broken zipper slider; 8cm stress tear on left elbow needing reinforced sashiko stitching.',
      preferredMethod: 'drop-off',
      status: 'Completed',
      estimatedPrice: 500,
      finalPrice: 500,
      dropoffVerified: true,
      pickupVerified: true,
      qrCode: qr4,
      location: { type: 'Point', coordinates: [90.4071, 23.7772], address: 'Mohakhali, Dhaka' },
    });
    sampleTickets.push(req4);

    const q4 = await Quote.create({
      repairRequestId: req4._id,
      repairerId: repMap['sultana.textile@repairhub.com']._id,
      price: 500,
      estimatedDays: 1,
      message: 'Installed original antique brass YKK zipper and hand-stitched Japanese sashiko patch over elbow stress tear.',
      status: 'Accepted',
    });
    await Payment.create({
      repairRequestId: req4._id,
      quoteId: q4._id,
      payerId: avishek._id,
      payeeId: repMap['sultana.textile@repairhub.com']._id,
      amount: 500,
      platformFee: 25,
      method: 'Nagad',
      transactionId: `TRX-${Date.now()}-04`,
      status: 'Successful',
      escrowStatus: 'RELEASED_TO_REPAIRER',
      releasedAt: new Date(),
    });
    await Review.create({
      repairRequestId: req4._id,
      repairerId: repMap['sultana.textile@repairhub.com']._id,
      requesterId: avishek._id,
      qualityRating: 5,
      communicationRating: 5,
      turnaroundRating: 5,
      comment: 'Authentic circular fashion repair! The sashiko stitching actually made the jacket look even more stylish.',
    });

    // Ticket 5: READY FOR PICKUP (Bicycle Hydraulic Brakes) -> Dhaka Cycle & Gear Hub
    const t5 = generateTicketNumber();
    const qr5 = await generateQRCodeDataURL({ ticketNumber: t5, requesterId: profTanvir._id });
    const req5 = await RepairRequest.create({
      ticketNumber: t5,
      requesterId: profTanvir._id,
      assignedRepairerId: repMap['bikedoctor@repairhub.com']._id,
      itemTitle: 'Trek Marlin 7 Mountain Bike (Hydraulic Brake Bleeding)',
      itemDescription: 'Rear brake lever pulls completely to handlebar with zero braking power. Front disc rotor is rubbing.',
      category: 'Bicycles',
      subCategory: 'Mountain Bikes',
      photos: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800'],
      issueDescription: 'Air bubbles in hydraulic brake line; bent 160mm stainless rotor needing alignment.',
      preferredMethod: 'drop-off',
      status: 'Ready for Pickup',
      estimatedPrice: 850,
      finalPrice: 850,
      dropoffVerified: true,
      pickupVerified: false,
      qrCode: qr5,
      location: { type: 'Point', coordinates: [90.4042, 23.7931], address: 'Banani, Dhaka' },
    });
    sampleTickets.push(req5);

    const q5 = await Quote.create({
      repairRequestId: req5._id,
      repairerId: repMap['bikedoctor@repairhub.com']._id,
      price: 850,
      estimatedDays: 1,
      message: 'Complete mineral oil bleed and fresh fluid flush, trued rotor to within 0.1mm tolerance, adjusted caliper pistons.',
      status: 'Accepted',
    });
    await Payment.create({
      repairRequestId: req5._id,
      quoteId: q5._id,
      payerId: profTanvir._id,
      payeeId: repMap['bikedoctor@repairhub.com']._id,
      amount: 850,
      platformFee: 42.5,
      method: 'bKash',
      transactionId: `TRX-${Date.now()}-05`,
      status: 'Successful',
      escrowStatus: 'HELD_IN_ESCROW',
    });

    // Ticket 6: IN PROGRESS (Philips Air Fryer) -> Master Rafiq
    const t6 = generateTicketNumber();
    const qr6 = await generateQRCodeDataURL({ ticketNumber: t6, requesterId: samira._id });
    const req6 = await RepairRequest.create({
      ticketNumber: t6,
      requesterId: samira._id,
      assignedRepairerId: repMap['rafiq@repairhub.com']._id,
      itemTitle: 'Philips XXL Digital Air Fryer (Heating Relay Fault)',
      itemDescription: 'Fan blows cold air. Digital panel works but cooking temperature never rises.',
      category: 'Home Appliances',
      subCategory: 'Air Fryer',
      photos: ['https://images.unsplash.com/photo-1585515320310-259814833e62?w=800'],
      issueDescription: 'Failed thermal fuse (216°C) and sticking 12V DC heating relay on control PCB.',
      preferredMethod: 'drop-off',
      status: 'In Progress',
      estimatedPrice: 950,
      finalPrice: 950,
      dropoffVerified: true,
      pickupVerified: false,
      qrCode: qr6,
      location: { type: 'Point', coordinates: [90.3752, 23.7465], address: 'Dhanmondi, Dhaka' },
    });
    sampleTickets.push(req6);

    const q6 = await Quote.create({
      repairRequestId: req6._id,
      repairerId: repMap['rafiq@repairhub.com']._id,
      price: 950,
      estimatedDays: 2,
      message: 'Replacing blown thermal cutout fuse and soldering new heavy-duty Omron relay onto power board.',
      status: 'Accepted',
    });
    await Payment.create({
      repairRequestId: req6._id,
      quoteId: q6._id,
      payerId: samira._id,
      payeeId: repMap['rafiq@repairhub.com']._id,
      amount: 950,
      platformFee: 47.5,
      method: 'bKash',
      transactionId: `TRX-${Date.now()}-06`,
      status: 'Successful',
      escrowStatus: 'HELD_IN_ESCROW',
    });

    // Ticket 7: IN PROGRESS (Sony Headphone) -> Dhanmondi Audio Lab
    const t7 = generateTicketNumber();
    const qr7 = await generateQRCodeDataURL({ ticketNumber: t7, requesterId: avishek._id });
    const req7 = await RepairRequest.create({
      ticketNumber: t7,
      requesterId: avishek._id,
      assignedRepairerId: repMap['dhanmondi.audio@repairhub.com']._id,
      itemTitle: 'Sony WH-1000XM4 Noise Cancelling Headphones',
      itemDescription: 'Left swivel hanger snapped when folding into case. Left earbud has intermittent crackle.',
      category: 'Electronics',
      subCategory: 'Audio',
      photos: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
      issueDescription: 'Snapped cast-plastic hinge arm; pinched audio ground wire inside swivel channel.',
      preferredMethod: 'drop-off',
      status: 'In Progress',
      estimatedPrice: 1200,
      finalPrice: 1200,
      dropoffVerified: true,
      pickupVerified: false,
      qrCode: qr7,
      location: { type: 'Point', coordinates: [90.4071, 23.7772], address: 'Mohakhali, Dhaka' },
    });
    sampleTickets.push(req7);

    const q7 = await Quote.create({
      repairRequestId: req7._id,
      repairerId: repMap['dhanmondi.audio@repairhub.com']._id,
      price: 1200,
      estimatedDays: 2,
      message: 'Installing reinforced carbon-fiber replacement hinge assembly and micro-soldering audio ground wire.',
      status: 'Accepted',
    });
    await Payment.create({
      repairRequestId: req7._id,
      quoteId: q7._id,
      payerId: avishek._id,
      payeeId: repMap['dhanmondi.audio@repairhub.com']._id,
      amount: 1200,
      platformFee: 60,
      method: 'Card',
      transactionId: `TRX-${Date.now()}-07`,
      status: 'Successful',
      escrowStatus: 'HELD_IN_ESCROW',
    });

    // Ticket 8: QUOTED / OPEN FOR BIDS (Singer Sewing Machine)
    const t8 = generateTicketNumber();
    const qr8 = await generateQRCodeDataURL({ ticketNumber: t8, requesterId: samira._id });
    const req8 = await RepairRequest.create({
      ticketNumber: t8,
      requesterId: samira._id,
      itemTitle: 'Singer Heavy Duty 4432 Sewing Machine',
      itemDescription: 'Needle hits the bobbin case on downstroke. Timing belt skips under heavy fabric.',
      category: 'Home Appliances',
      subCategory: 'Sewing Machine',
      photos: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=800'],
      issueDescription: 'Hook timing out of synchronization with needle bar height; drive gear grub screw loosened.',
      preferredMethod: 'drop-off',
      status: 'Quoted',
      estimatedPrice: 600,
      qrCode: qr8,
      location: { type: 'Point', coordinates: [90.3752, 23.7465], address: 'Dhanmondi, Dhaka' },
    });
    sampleTickets.push(req8);

    // Competing bids for Ticket 8
    await Quote.create({
      repairRequestId: req8._id,
      repairerId: repMap['sultana.textile@repairhub.com']._id,
      price: 600,
      estimatedDays: 1,
      message: 'Specialist in Singer mechanical timing. Will reset rotary hook gap and replace worn feed dog screws.',
      status: 'Pending',
    });
    await Quote.create({
      repairRequestId: req8._id,
      repairerId: repMap['heritage.clocks@repairhub.com']._id,
      price: 750,
      estimatedDays: 2,
      message: 'Complete mechanical alignment, ultrasonic hook degreasing, and timing gear calibration.',
      status: 'Pending',
    });

    // Ticket 9: REQUESTED (HP LaserJet Printer)
    const t9 = generateTicketNumber();
    const qr9 = await generateQRCodeDataURL({ ticketNumber: t9, requesterId: profTanvir._id });
    const req9 = await RepairRequest.create({
      ticketNumber: t9,
      requesterId: profTanvir._id,
      itemTitle: 'HP LaserJet Pro M404dn Office Printer',
      itemDescription: 'Grinds loudly during paper feed and pulls 3-4 sheets at once causing jam in fuser.',
      category: 'Electronics',
      subCategory: 'Printers',
      photos: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=800'],
      issueDescription: 'Worn paper separation pad rubber and glazed pickup rollers.',
      preferredMethod: 'drop-off',
      status: 'Requested',
      estimatedPrice: 650,
      qrCode: qr9,
      location: { type: 'Point', coordinates: [90.4042, 23.7931], address: 'Banani, Dhaka' },
    });
    sampleTickets.push(req9);

    // Ticket 10: REQUESTED (DJI Drone Motor)
    const t10 = generateTicketNumber();
    const qr10 = await generateQRCodeDataURL({ ticketNumber: t10, requesterId: avishek._id });
    const req10 = await RepairRequest.create({
      ticketNumber: t10,
      requesterId: avishek._id,
      itemTitle: 'DJI Mini 2 Lightweight Drone',
      itemDescription: 'Rear-left propeller motor vibrates with high pitch and ESC beeps warning code on startup.',
      category: 'Electronics',
      subCategory: 'Drones',
      photos: ['https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800'],
      issueDescription: 'Bent motor bell shaft and dirt buildup in stator bearings after rough field landing.',
      preferredMethod: 'drop-off',
      status: 'Requested',
      estimatedPrice: 800,
      qrCode: qr10,
      location: { type: 'Point', coordinates: [90.4071, 23.7772], address: 'Mohakhali, Dhaka' },
    });
    sampleTickets.push(req10);

    console.log(`[Seed] Created ${sampleTickets.length} repair requests across Dhaka.`);

    // 5. Update All Repairers to Strictly Match their Authentic Reviews
    for (const r of repairers) {
      const revs = await Review.find({ repairerId: r._id });
      const count = revs.length;
      const avg = count > 0
        ? Number((revs.reduce((sum, rev) => sum + (Number(rev.averageRating || rev.rating) || 0), 0) / count).toFixed(1))
        : 0;
      await User.findByIdAndUpdate(r._id, { rating: avg, ratingCount: count });
      console.log(`[Seed Sync] ${r.businessName}: ${count > 0 ? `★ ${avg} (${count} reviews)` : 'Unrated (0 reviews)'}`);
    }

    // 6. Seed Realistic Appointment Bookings
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    tomorrow.setHours(11, 0, 0, 0);

    const dayAfter = new Date(Date.now() + 48 * 60 * 60 * 1000);
    dayAfter.setHours(15, 30, 0, 0);

    await Booking.create({
      requesterId: avishek._id,
      repairerId: repMap['bikedoctor@repairhub.com']._id,
      repairRequestId: req5._id,
      scheduledTime: tomorrow,
      durationMinutes: 45,
      status: 'Confirmed',
      type: 'In-Shop Diagnostic',
      notes: 'Customer dropping off bike for final test ride inspection after brake bleed.',
    });

    await Booking.create({
      requesterId: samira._id,
      repairerId: repMap['dhanmondi.audio@repairhub.com']._id,
      scheduledTime: dayAfter,
      durationMinutes: 60,
      status: 'Confirmed',
      type: 'In-Shop Diagnostic',
      notes: 'Diagnostic for Marantz vintage amplifier stereo balance channel drop.',
    });

    console.log('[Seed] Created sample verified appointment bookings.');

    // 7. Seed 4 Real-Life Dhaka Repair Café Events (Module 3)
    const eventDate1 = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000);
    eventDate1.setHours(10, 0, 0, 0);

    const eventDate2 = new Date(Date.now() + 13 * 24 * 60 * 60 * 1000);
    eventDate2.setHours(14, 0, 0, 0);

    const eventDate3 = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
    eventDate3.setHours(10, 30, 0, 0);

    const eventDate4 = new Date(Date.now() + 27 * 24 * 60 * 60 * 1000);
    eventDate4.setHours(11, 0, 0, 0);

    await RepairCafeEvent.create({
      organizerId: adminUser._id,
      title: 'BRAC University Zero-Waste Repair Café - Merul Badda',
      description: 'Community repair day at BRAC University Main Campus! Volunteer technicians and student engineers repair faulty small electronics, microwave ovens, kitchen appliances, and bicycles completely free of labor charges.',
      date: eventDate1,
      startTime: '10:00 AM',
      endTime: '04:30 PM',
      capacity: 35,
      categoriesHandled: ['Electronics', 'Home Appliances', 'Clothing/Textiles', 'Bicycles'],
      location: {
        type: 'Point',
        coordinates: [90.4255, 23.7712],
        venueName: 'BRAC University Main Campus Plaza',
        address: 'Kha 224 Pragati Sarani, Merul Badda, Dhaka 1212',
      },
      rsvps: [
        { userId: avishek._id, status: 'Attending', respondedAt: new Date() },
        { userId: profTanvir._id, status: 'Attending', respondedAt: new Date() },
      ],
    });

    await RepairCafeEvent.create({
      organizerId: adminUser._id,
      title: 'Dhanmondi Lake Circular Fix-It Hub',
      description: 'Bring your broken audio gear, vintage electronics, table fans, and kitchen blenders. Learn circular electronics care by the scenic lakeside with Master repair mentors.',
      date: eventDate2,
      startTime: '02:00 PM',
      endTime: '06:30 PM',
      capacity: 25,
      categoriesHandled: ['Electronics', 'Home Appliances', 'Mechanical'],
      location: {
        type: 'Point',
        coordinates: [90.3752, 23.7465],
        venueName: 'Rabindra Sarobar Amphitheater Grounds',
        address: 'Dhanmondi Lake Park, Road 8A, Dhaka',
      },
      rsvps: [
        { userId: samira._id, status: 'Attending', respondedAt: new Date() },
      ],
    });

    await RepairCafeEvent.create({
      organizerId: adminUser._id,
      title: 'Gulshan Community Fix-It Workshop',
      description: 'Hands-on repair clinic for household gadgets, clothing mending, sewing machine maintenance, and e-bike diagnostics. Hosted collaboratively with Gulshan civic partners.',
      date: eventDate3,
      startTime: '10:30 AM',
      endTime: '04:00 PM',
      capacity: 20,
      categoriesHandled: ['Electronics', 'Home Appliances', 'Clothing/Textiles', 'Bicycles'],
      location: {
        type: 'Point',
        coordinates: [90.4172, 23.7895],
        venueName: 'Gulshan Youth Club Ground Pavilion',
        address: 'Road 83, Gulshan 2, Dhaka',
      },
      rsvps: [
        { userId: profTanvir._id, status: 'Attending', respondedAt: new Date() },
      ],
    });

    await RepairCafeEvent.create({
      organizerId: adminUser._id,
      title: 'Mirpur DOHS Community Electronics Clinic',
      description: 'Practical neighborhood fix-it event tackling induction cooktops, UPS batteries, microwave ovens, and power tools. Supported by Mirpur-10 Thermal & Appliance Care.',
      date: eventDate4,
      startTime: '11:00 AM',
      endTime: '05:00 PM',
      capacity: 30,
      categoriesHandled: ['Electronics', 'Home Appliances', 'Mechanical'],
      location: {
        type: 'Point',
        coordinates: [90.3712, 23.8315],
        venueName: 'Mirpur DOHS Community Center Hall',
        address: 'Road 10, Mirpur DOHS, Dhaka',
      },
      rsvps: [],
    });

    console.log('[Seed] Created 4 Dhaka community repair café events.');

    // 8. Seed Real DIY Guides (Community Knowledge Base)
    await Guide.create({
      title: 'Replacing a burnt microwave waveguide mica plate (Samsung / Panasonic)',
      authorId: repMap['rafiq@repairhub.com']._id,
      authorName: 'Master Rafiq',
      category: 'Home Appliances',
      difficulty: 'Easy',
      estimatedMinutes: 15,
      summary: 'Fix sparking inside the microwave chamber by swapping out the burnt mica sheet on the interior right wall.',
      toolsRequired: ['Phillips screwdriver', 'Utility scissors', 'Alcohol wipe'],
      partsNeeded: ['Universal mica sheet (13 × 13 cm)'],
      steps: [
        {
          stepNumber: 1,
          stepTitle: 'Unplug — Safety First',
          instruction: 'Disconnect from the AC mains outlet. Note: this guide only covers the interior mica cover; it does not require opening the outer high-voltage casing.',
          safetyNote: 'Never touch internal 2,000 V capacitor.'
        },
        {
          stepNumber: 2,
          stepTitle: 'Remove the Burnt Mica Card',
          instruction: 'Locate the rectangular sheet on the right interior wall. Slide out the plastic retention pin.'
        },
        {
          stepNumber: 3,
          stepTitle: 'Trace & Cut Replacement',
          instruction: 'Lay the old sheet on new mica, trace the outline with a pencil, and cut with scissors.'
        },
        {
          stepNumber: 4,
          stepTitle: 'Degrease & Install',
          instruction: 'Wipe grease from the cavity behind the slot with isopropyl alcohol, insert the new sheet, and latch the pin.'
        }
      ],
      upvotes: 42
    });

    await Guide.create({
      title: 'Shimano 21/24-speed derailleur indexing and chain slip fix',
      authorId: repMap['bikedoctor@repairhub.com']._id,
      authorName: 'Dhaka Bike Doctor',
      category: 'Bicycles',
      difficulty: 'Moderate',
      estimatedMinutes: 25,
      summary: 'Eliminate gear clicking, phantom shifts, and chain slippage by tuning limit screws and cable tension.',
      toolsRequired: ['PH2 screwdriver', '5mm hex key', 'Bike stand'],
      partsNeeded: ['PTFE chain lubricant'],
      steps: [
        {
          stepNumber: 1,
          stepTitle: 'Check Hanger Alignment',
          instruction: 'Look from behind — the derailleur cage must be perfectly vertical relative to the cassette.'
        },
        {
          stepNumber: 2,
          stepTitle: 'Set High Limit Screw',
          instruction: 'Shift to smallest cog. Rotate H-screw until top jockey wheel lines up under the outer cog edge.'
        },
        {
          stepNumber: 3,
          stepTitle: 'Fine-Tune Cable Tension',
          instruction: 'Shift one click up. If the chain hesitates, turn the barrel adjuster ¼ turn counter-clockwise.'
        }
      ],
      upvotes: 35
    });

    await Guide.create({
      title: 'Smartphone OLED display replacement (adhesive softening + battery disconnect)',
      authorId: repMap['farhan.laptop@repairhub.com']._id,
      authorName: 'FixSmart Lab',
      category: 'Smartphones',
      difficulty: 'Advanced',
      estimatedMinutes: 40,
      summary: 'Safely soften waterproof perimeter adhesive, disconnect the battery first, and transplant the digitizer assembly.',
      toolsRequired: ['Heat pad (75°C)', 'Suction cup', 'Plastic pry picks', 'Pentalobe driver'],
      partsNeeded: ['Replacement OLED assembly', 'Pre-cut B-7000 adhesive tape'],
      steps: [
        {
          stepNumber: 1,
          stepTitle: 'Heat the Perimeter (70–80°C)',
          instruction: 'Apply controlled heat for 3 min to soften factory waterproof adhesive.',
          safetyNote: 'Never exceed 85°C — risk of battery swell or puncture.'
        },
        {
          stepNumber: 2,
          stepTitle: 'Disconnect Battery Ribbon First',
          instruction: 'Remove the shielding bracket and unplug the battery ribbon before touching any display connectors.',
          safetyNote: 'Short-circuit risk: always cut power before handling flex cables.'
        }
      ],
      upvotes: 28
    });

    await Guide.create({
      title: 'Blender Motor Carbon Brush Replacement & Commutator Reconditioning',
      authorId: repMap['rafiq@repairhub.com']._id,
      authorName: 'Master Rafiq',
      category: 'Home Appliances',
      difficulty: 'Easy',
      estimatedMinutes: 20,
      summary: 'Replace worn motor carbon brushes to eliminate burning electrical smell and restore high-torque blending power.',
      toolsRequired: ['Phillips Screwdriver', 'Fine 600-grit Sandpaper', 'Cotton Swabs'],
      partsNeeded: ['Carbon Brushes (matched pair, 5x5mm)'],
      steps: [
        {
          stepNumber: 1,
          stepTitle: 'Unplug and Access Motor Base',
          instruction: 'Unscrew the four rubber foot pads on the base and lift bottom housing.'
        },
        {
          stepNumber: 2,
          stepTitle: 'Inspect Carbon Brushes',
          instruction: 'Slide out spring-loaded carbon brushes from copper guides. If length is under 4mm, replace.'
        },
        {
          stepNumber: 3,
          stepTitle: 'Clean Commutator',
          instruction: 'Clean carbon dust from copper commutator bars using isopropyl alcohol before installing new brushes.'
        }
      ],
      upvotes: 19
    });

    await CommunityPost.create({
      authorId: repMap['rafiq@repairhub.com']._id,
      title: 'How to Fix Microwave Sparking & Arcing for under ৳200 in Dhaka',
      category: 'Home Appliances',
      content: 'If your microwave oven crackles or produces sparks on the right wall, 95% of the time it is caused by a carbonized mica waveguide sheet. Step 1: Disconnect AC cord and let capacitors discharge. Step 2: Remove the 1-2 small plastic push clips or screws holding the mica plate on the right chamber wall. Step 3: Clean the bare cavity with isopropyl alcohol. Step 4: Buy a ৳150 mica replacement sheet from Gulshan-1 or Stadium market, cut to shape using the old one as a stencil, and pop it back in.',
      difficulty: 'Beginner',
      upvoteCount: 68,
    });

    await CommunityPost.create({
      authorId: repMap['farhan.laptop@repairhub.com']._id,
      title: 'Fixing Laptop Thermal Throttling in Dusty Dhaka Environments',
      category: 'Electronics',
      content: 'Dhaka particulate dust builds up a felt-like blanket between the cooling fan impeller and heatsink copper fins within 6-9 months. Step 1: Disconnect battery immediately after opening bottom cover. Step 2: Unscrew cooling fan and clear the dust mat with a soft anti-static brush. Step 3: Clean dried crusty OEM thermal paste with 99% IPA. Step 4: Apply a pea-sized dot of Arctic MX-4 or Honeywell PTM7950 phase-change pad. CPU temperatures will drop 18°C-25°C.',
      difficulty: 'Intermediate',
      upvoteCount: 84,
    });

    await CommunityPost.create({
      authorId: repMap['bikedoctor@repairhub.com']._id,
      title: 'Emergency Bicycle Chain Slipping & Derailleur B-Tension Tuning',
      category: 'Bicycles',
      content: 'Chains slipping under pedal pressure during Dhaka traffic restarts are usually due to chain stretch or stiff link pins. Step 1: Inspect chain with a ৳300 chain checker tool; if elongation exceeds 0.75%, replace chain to save chainrings. Step 2: Check rear derailleur hanger alignment from behind. Step 3: Turn barrel adjuster counter-clockwise 1/2 turn if chain hesitates to climb up into easier gears.',
      difficulty: 'Beginner',
      upvoteCount: 52,
    });

    await CommunityPost.create({
      authorId: repMap['heritage.clocks@repairhub.com']._id,
      title: 'Restoring Vintage Brass Clockwork & Stripping Hardened Lubricant',
      category: 'Mechanical',
      content: 'Never use WD-40 on mechanical clock movements! WD-40 attracts ambient dust and gums up the escapement wheels. Instead, use pure mineral spirits or odorless kerosene in an ultrasonic bath, then sparingly apply Moebius 8000 micro-oil only to the pivot bushings with an oiler pin.',
      difficulty: 'Advanced',
      upvoteCount: 39,
    });

    console.log('[Seed] Created 4 genuine DIY repair guides in Guide collection and 4 CommunityPosts.');
    console.log('=====================================================');
    console.log('🌱 RepairHub Showcase Database Seeding Complete!');
    console.log('=====================================================');

    return { success: true };
  } catch (err) {
    console.error('[Seed Error]:', err);
    throw err;
  }
};

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('[Seed Runner] Finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Seed Runner Fatal]:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
