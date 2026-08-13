const express = require('express');
const router = express.Router();
const Enquiry = require('../models/Enquiry');
const { protect, authorize } = require('../middleware/auth.middleware');

const nodemailer = require('nodemailer');

// POST new enquiry
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, property, postedBy, message } = req.body;
    const enquiry = new Enquiry({
      name,
      email,
      phone,
      property,
      postedBy,
      message,
      // If user is logged in, you could optionally pass their ID here, but for now we rely on the guest fields.
      ...(req.body.user && { user: req.body.user })
    });
    const savedEnquiry = await enquiry.save();

    // Send email using Nodemailer
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        const mailOptions = {
          from: process.env.GMAIL_USER,
          to: process.env.GMAIL_USER, // Sending to yourself
          subject: `New Lead from ${name} on Green Vijaya`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Lead email sent successfully');
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    res.status(201).json(savedEnquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET enquiries (Admin sees all, User sees theirs)
router.get('/', protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'admin') {
      // Admin sees all
    } else {
      query.user = req.user._id;
    }
    
    const enquiries = await Enquiry.find(query)
      .populate('user', 'name email mobileNumber')
      .populate({
        path: 'property',
        populate: { path: 'postedBy' }
      })
      .populate('postedBy');
    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
// UPDATE enquiry status
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }
    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE enquiry
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }
    res.json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
