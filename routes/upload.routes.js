const express = require('express');
const router = express.Router();
const { upload } = require('../utils/cloudinary');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, (req, res, next) => {
  const uploadMiddleware = upload.array('images', 20);
  uploadMiddleware(req, res, function (err) {
    if (err) {
      return res.status(500).json({ message: 'Upload Middleware Error: ' + err.message });
    }
    next();
  });
}, (req, res) => {
  try {
    const imageUrls = req.files.map(file => {
      return file.path || `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    });
    res.json({ images: imageUrls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
