import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required.'],
      trim: true,
      maxlength: [160, 'Title cannot exceed 160 characters.'],
    },
    subject: {
      type: String,
      trim: true,
      maxlength: [80, 'Subject cannot exceed 80 characters.'],
      default: 'General',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters.'],
      default: '',
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required.'],
    },
    priority: {
      type: String,
      enum: {
        values: ['Low', 'Medium', 'High'],
        message: '{VALUE} is not a valid priority (Low, Medium, High).',
      },
      default: 'Medium',
    },
    status: {
      type: String,
      enum: {
        values: ['Pending', 'In Progress', 'Completed'],
        message: '{VALUE} is not a valid status.',
      },
      default: 'Pending',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

// Compound indexes for query optimization
taskSchema.index({ userId: 1, dueDate: 1 })
taskSchema.index({ userId: 1, status: 1 })
taskSchema.index({ userId: 1, completed: 1 })

// Pre-save hook to keep completed boolean synchronized with status
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.completed = this.status === 'Completed'
  } else if (this.isModified('completed')) {
    this.status = this.completed ? 'Completed' : (this.status === 'Completed' ? 'Pending' : this.status)
  }
  next()
})

export default mongoose.model('Task', taskSchema)
