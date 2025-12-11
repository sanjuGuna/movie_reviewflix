// middlewares/reviewOwner.js
const Review = require('../model/Review');
module.exports = async (req, res, next) => {
    try {
        const reviewId = req.params.reviewId || req.params.id;
        const review = await Review.findById(reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found' });
    req.review = review; // attach for route handlers
    next();
    } catch (err) {
        next(err);
    }
};
