const Medicine = require('../models/Medicine');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Get all medicines with filtering and pagination
 * @route   GET /api/medicines
 * @access  Public
 */
const getMedicines = async (req, res) => {
  const { search, category, type, prescriptionRequired, page = 1, limit = 12 } = req.query;

  const filter = {};

  if (category && category !== 'All') {
    filter.category = category;
  }
  
  if (type) {
    filter.type = type;
  }

  if (prescriptionRequired !== undefined && prescriptionRequired !== 'all') {
    if (prescriptionRequired === 'prescription') filter.prescriptionRequired = true;
    if (prescriptionRequired === 'otc') filter.prescriptionRequired = false;
  }

  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const medicines = await Medicine.find(filter)
    .select('name slug category type description uses prescriptionRequired isActive')
    .skip(skip)
    .limit(parseInt(limit, 10));

  const total = await Medicine.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: medicines.length,
    page: parseInt(page, 10),
    pages: Math.ceil(total / parseInt(limit, 10)),
    data: medicines,
  });
};

/**
 * @desc    Get distinct medicine categories
 * @route   GET /api/medicines/categories
 * @access  Public
 */
const getMedicineCategories = async (req, res) => {
  // Instead of computing dynamically, we know the enum.
  // However, computing dynamically only returns categories that have medicines.
  const categories = await Medicine.distinct('category');
  // Ensure 'All' is at the front, if needed by UI
  res.status(200).json({
    success: true,
    data: categories,
  });
};

/**
 * @desc    Get single medicine by slug
 * @route   GET /api/medicines/:slug
 * @access  Public
 */
const getMedicineBySlug = async (req, res) => {
  const medicine = await Medicine.findOne({ slug: req.params.slug });

  if (!medicine) {
    return res.status(404).json({ success: false, message: 'Medicine not found.' });
  }

  res.status(200).json({ success: true, data: medicine });
};

module.exports = {
  getMedicines: asyncHandler(getMedicines),
  getMedicineCategories: asyncHandler(getMedicineCategories),
  getMedicineBySlug: asyncHandler(getMedicineBySlug),
};
