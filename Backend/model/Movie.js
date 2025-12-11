const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    releaseYear: {
        type: Number,
        required: true
    },
    posterUrl: {
        type: String,
        default: ''
    },
    genres: {
        type: [String],  // ["Action", "Drama"]
        default: []
    },
    createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
    }

}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);
