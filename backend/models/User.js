import mongoose from 'mongoose'; // BEGIN:
import bcrypt from 'bcrypt'; // NEW: Add bcrypt for password hashing
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// Hash the password before saving the user
userSchema.pre('save', async function(next) { // NEW: Pre-save hook
    if (!this.isModified('password')) return next(); // NEW: Check if password is modified
    this.password = await bcrypt.hash(this.password, 10); // NEW: Hash the password
    next(); // NEW: Proceed to save
});

// Add this method to your schema
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema); // END:

export default User;
