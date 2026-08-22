const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { CLOUDINARY } = require('./env');

// env.js already loaded .env and downgraded STORAGE_DRIVER to 'local' if these
// are incomplete, so reaching here means all three keys are present.
cloudinary.config(CLOUDINARY);

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'healthsphere/reports',
    allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
  },
});

module.exports = { cloudinary, storage };
