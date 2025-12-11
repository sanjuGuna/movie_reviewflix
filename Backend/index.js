const dotenv=require('dotenv');
dotenv.config();
const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors')

const app=express();
//middleware
app.use(express.json());
app.use(cors());
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log('MongoDB connected successfully');
    } catch (err) {
        console.error('Error connecting to database:', err);
        process.exit(1);
    }
};

connectDB();
app.use('/api/movies',require('./routes/movies'));
app.use('/api',require('./routes/reviews'));
app.use('/api/auth',require('./routes/auth'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
