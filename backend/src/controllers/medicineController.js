const Medicine = require('../models/Medicine');

/**
 * @desc    Get all medicines with filtering and pagination
 * @route   GET /api/medicines
 * @access  Public
 */
const getMedicines = async (req, res) => {
  try {
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
  } catch (error) {
    console.error('GetMedicines Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get distinct medicine categories
 * @route   GET /api/medicines/categories
 * @access  Public
 */
const getMedicineCategories = async (req, res) => {
  try {
    // Instead of computing dynamically, we know the enum.
    // However, computing dynamically only returns categories that have medicines.
    const categories = await Medicine.distinct('category');
    // Ensure 'All' is at the front, if needed by UI
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('GetMedicineCategories Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get single medicine by slug
 * @route   GET /api/medicines/:slug
 * @access  Public
 */
const getMedicineBySlug = async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ slug: req.params.slug });

    if (!medicine) {
      return res.status(404).json({ success: false, message: 'Medicine not found.' });
    }

    res.status(200).json({ success: true, data: medicine });
  } catch (error) {
    console.error('GetMedicineBySlug Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getMedicines,
  getMedicineCategories,
  getMedicineBySlug,
};
