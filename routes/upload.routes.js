const express = require('express');
const router = express.Router();
const { upload } = require('../utils/cloudinary');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, upload.array('images', 5), (req, res) => {
  try {
    const imageUrls = req.files.map(file => {
      return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    });
    res.json({ images: imageUrls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
