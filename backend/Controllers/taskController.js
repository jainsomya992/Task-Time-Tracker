import Task from '../models/Task.js';
import User from '../models/User.js';


// @desc    Get all tasks for a user
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id });
        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Add a new task
// @route   POST /api/tasks
// @access  Private
const addTask = async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Please add a title' });
        }

        const task = await Task.create({
            user: req.user.id,
            title,
            description,
        });

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to update this task' });
        }

        console.log('Incoming update data:', req.body);
        // --- START OF FIX ---

        // ADD THESE LINES to handle title and description updates from the edit modal
        if (req.body.title) task.title = req.body.title;
        if (req.body.description !== undefined) task.description = req.body.description;
        
        // --- END OF FIX ---
        // Update fields (status or timeSpent etc.)
        if (req.body.status) task.status = req.body.status;
        if (req.body.timeSpent !== undefined) task.timeSpent = req.body.timeSpent;

        const updatedTask = await task.save();

        res.status(200).json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error.message);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // Make sure the logged-in user is the owner of the task
        if (task.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized to delete this task' });
        }

        await Task.deleteOne({ _id: req.params.id });

        res.status(200).json({ message: 'Task removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export {
    getTasks,
    addTask,
    updateTask,
    deleteTask,
};