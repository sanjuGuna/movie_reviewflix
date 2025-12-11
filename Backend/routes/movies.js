// routes/movies.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const ownerOnly = require('../middlewares/owneronly');
const Movie = require('../model/Movie');

// public read
router.get('/', async (req, res) => {
  const movies = await Movie.find().sort({ createdAt: -1 });
  res.json(movies);
});

router.get('/:id', async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

// create - owner only
router.post('/', auth, ownerOnly, async (req, res) => {
  try {
    const movie = new Movie({ ...req.body, createdBy: req.user._id });
    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// update - owner only
router.put('/:id', auth, ownerOnly, async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

// delete - owner only
router.delete('/:id', auth, ownerOnly, async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
