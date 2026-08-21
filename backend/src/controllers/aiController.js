const Disease = require('../models/Disease');

/**
 * @desc    AI Symptom Checker — match symptoms to possible diseases
 * @route   POST /api/ai/symptom-check
 * @access  Public (or Private)
 */
const symptomCheck = async (req, res) => {
  try {
    const { symptoms } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of symptoms.',
      });
    }

    // Normalize input
    const normalizedSymptoms = symptoms.map((s) => s.toLowerCase().trim());

    // Find diseases that match any of the symptoms
    const diseases = await Disease.find({
      symptoms: {
        $elemMatch: {
          $in: normalizedSymptoms.map((s) => new RegExp(s, 'i')),
        },
      },
    });

    // Calculate match score for each disease
    const results = diseases.map((disease) => {
      const matchedSymptoms = disease.symptoms.filter((ds) =>
        normalizedSymptoms.some((ns) => ds.toLowerCase().includes(ns) || ns.includes(ds.toLowerCase()))
      );

      const matchScore = Math.round((matchedSymptoms.length / disease.symptoms.length) * 100);

      return {
        disease: {
          id: disease._id,
          name: disease.name,
          slug: disease.slug,
          category: disease.category,
          severity: disease.severity,
          specialistType: disease.specialistType,
        },
        matchedSymptoms,
        totalSymptoms: disease.symptoms.length,
        matchScore,
      };
    });

    // Sort by match score (highest first)
    results.sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
      success: true,
      message: results.length > 0
        ? `Found ${results.length} possible condition(s) based on your symptoms.`
        : 'No matching conditions found. Please consult a doctor.',
      disclaimer: 'This is an AI-assisted prediction and NOT a medical diagnosis. Please consult a qualified healthcare professional.',
      data: results.slice(0, 5), // Top 5 matches
    });
  } catch (error) {
    console.error('SymptomCheck Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get disease details by slug
 * @route   GET /api/ai/diseases/:slug
 * @access  Public
 */
const getDiseaseBySlug = async (req, res) => {
  try {
    const disease = await Disease.findOne({ slug: req.params.slug });

    if (!disease) {
      return res.status(404).json({ success: false, message: 'Disease not found.' });
    }

    res.status(200).json({ success: true, data: disease });
  } catch (error) {
    console.error('GetDiseaseBySlug Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get all diseases (for search/reference)
 * @route   GET /api/ai/diseases
 * @access  Public
 */
const getAllDiseases = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = {};

    if (category && category !== 'All') filter.category = category;

    // DiseaseListing searches names and descriptions, so match both
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const diseases = await Disease.find(filter)
      .select('name slug description category severity specialistType symptoms')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: diseases.length,
      data: diseases,
    });
  } catch (error) {
    console.error('GetAllDiseases Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get distinct disease categories
 * @route   GET /api/ai/diseases/categories
 * @access  Public
 */
const getDiseaseCategories = async (req, res) => {
  try {
    const categories = await Disease.distinct('category');
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('GetDiseaseCategories Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

/**
 * @desc    Get doctors matching a disease's specialistType
 * @route   GET /api/ai/diseases/:slug/doctors
 * @access  Public
 */
const getDiseaseDoctors = async (req, res) => {
  try {
    const disease = await Disease.findOne({ slug: req.params.slug });

    if (!disease) {
      return res.status(404).json({ success: false, message: 'Disease not found.' });
    }

    const Doctor = require('../models/Doctor');
    const doctors = await Doctor.find({ specialization: disease.specialistType, isVerified: true })
      .populate('user', 'fullName avatar _id');

    res.status(200).json({ success: true, data: doctors });
  } catch (error) {
    console.error('GetDiseaseDoctors Error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { symptomCheck, getDiseaseBySlug, getAllDiseases, getDiseaseCategories, getDiseaseDoctors };
