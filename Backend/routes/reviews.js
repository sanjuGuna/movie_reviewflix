// routes/reviews.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // if nested under /movies/:movieId
const auth = require('../middlewares/auth');
const reviewOwner = require('../middlewares/reviewOwner');
const Review = require('../model/Review');
const Movie = require('../model/Movie');

// create review (any authenticated user with role 'user' or even 'owner' if you allow)
router.post('/:movieId/reviews', auth, async (req, res) => {
  try {
    const { movieId } = req.params;
    const movie = await Movie.findById(movieId);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    // optional: prevent duplicate reviews by same user
    const existing = await Review.findOne({ movie: movieId, author: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this movie' });
    }

    const review = new Review({
      movie: movieId,
      author: req.user._id,
      rating: req.body.rating,
      text: req.body.text
    });
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// edit review (only author or owner/moderator)
router.put('/reviews/:id', auth, reviewOwner, async (req, res) => {
  // req.review is attached by reviewOwner
  const { rating, text } = req.body;
  req.review.rating = rating ?? req.review.rating;
  req.review.text = text ?? req.review.text;
  await req.review.save();
  res.json(req.review);
});

// delete review (only author or owner)
router.delete('/reviews/:id', auth, reviewOwner, async (req, res) => {
  await req.review.deleteOne();
  res.json({ message: 'Review deleted' });
});

// list reviews for a movie
router.get('/:movieId/reviews', async (req, res) => {
  const reviews = await Review.find({ movie: req.params.movieId }).populate('author', 'name');
  res.json(reviews);
});

module.exports = router;
