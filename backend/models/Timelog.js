const mongoose = require('mongoose');

const TimelogSchema = new mongoose.Schema({
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: false
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: true
    }
}, {
    timestamps: true
});

const Timelog = mongoose.model('Timelog', TimelogSchema);
module.exports = Timelog;
