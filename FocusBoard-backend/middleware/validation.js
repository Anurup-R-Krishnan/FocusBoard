const { z } = require('zod');

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];
const TASK_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'];
const PROJECT_STATUSES = ['On Track', 'At Risk', 'Delayed', 'Completed'];
const MAX_STRING_LENGTH = 500;
const MAX_TITLE_LENGTH = 200;
const MAX_EMAIL_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 100;
const MAX_URL_LENGTH = 2048;

const isValidUrl = (val) => {
    if (!val) return true;
    try {
        new URL(val);
        return val.length <= MAX_URL_LENGTH;
    } catch {
        return false;
    }
};

const validateSchema = (schema) => {
    return (req, res, next) => {
        try {
            const parsed = schema.parse(req.body);
            req.body = parsed;
            next();
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors
            });
        }
    };
};

const createUserSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    email_id: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters").max(100),
    age: z.number().positive().optional(),
});

const loginUserSchema = z.object({
    email_id: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required").max(100),
});

const createTaskSchema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    project: z.string().max(100).optional(),
    client: z.string().max(100).optional(),
    status: z.enum(TASK_STATUSES).optional(),
    priority: z.enum(TASK_PRIORITIES).optional(),
    timeSpent: z.number().nonnegative().optional(),
    billable: z.boolean().optional(),
    archived: z.boolean().optional(),
    notes: z.string().max(5000).optional(),
    dueDate: z.coerce.date().optional(),
});

const updateTaskSchema = createTaskSchema.partial().refine(
    (payload) => Object.keys(payload).length > 0,
    { message: "At least one field is required to update a task." }
);

const createProjectSchema = z.object({
    title: z.string().min(1, "Project title is required").max(200),
    members: z.number().int().positive().optional(),
    progress: z.number().min(0).max(100).optional(),
    status: z.enum(PROJECT_STATUSES).optional(),
    due_date: z.coerce.date().optional(),
});

const updateProjectSchema = createProjectSchema.partial().refine(
    (payload) => Object.keys(payload).length > 0,
    { message: "At least one field is required to update a project." }
);

const createClientSchema = z.object({
    name: z.string().min(1, "Client name is required").max(100),
    company: z.string().max(100).optional(),
    total_hours: z.number().nonnegative().optional(),
    billable_amount: z.number().nonnegative().optional(),
    color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Invalid color hex").optional(),
    hourlyRate: z.number().nonnegative().optional(),
    email: z.string().email("Invalid email address").max(100).optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    notes: z.string().max(5000).optional().or(z.literal('')),
});

const updateClientSchema = createClientSchema.partial().refine(
    (payload) => Object.keys(payload).length > 0,
    { message: "At least one field is required to update a client." }
);

const parentalControlsSchema = z.object({
    age: z.number().int().positive().optional(),
    parentEmail: z.string().email("Invalid email format.").optional(),
    nsfwAlertPreference: z.enum(['email', 'in_app', 'both', 'none']).optional(),
}).refine((payload) => {
    if (payload.age && payload.age < 16 && payload.nsfwAlertPreference && payload.nsfwAlertPreference !== 'none') {
        return Boolean(payload.parentEmail);
    }
    return true;
}, {
    message: 'Parent email is required for users under 16 with NSFW alerts enabled.',
});

module.exports = {
    validateSchema,
    createUserSchema,
    loginUserSchema,
    createTaskSchema,
    updateTaskSchema,
    createProjectSchema,
    updateProjectSchema,
    createClientSchema,
    updateClientSchema,
    parentalControlsSchema,
};
