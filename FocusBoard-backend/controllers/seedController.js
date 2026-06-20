import Category from '../models/Category.js';
import IssueType from '../models/IssueType.js';

const DEFAULT_CATEGORIES = [
    { name: 'Productivity', description: 'Work-related tools and documents', color: 'bg-blue-500', icon: 'Briefcase', productivityScore: 5, isDefault: true },
    { name: 'Development', description: 'Coding, debugging, and technical work', color: 'bg-purple-500', icon: 'Code', productivityScore: 4, isDefault: true },
    { name: 'Design', description: 'Creative and visual work', color: 'bg-pink-500', icon: 'PenTool', productivityScore: 3, isDefault: true },
    { name: 'Communication', description: 'Email, chat, and collaboration', color: 'bg-green-500', icon: 'MessageCircle', productivityScore: 2, isDefault: true },
    { name: 'Entertainment', description: 'Music, streaming, and social media', color: 'bg-yellow-500', icon: 'Coffee', productivityScore: -2, isDefault: true },
    { name: 'Learning', description: 'Research and educational content', color: 'bg-orange-500', icon: 'BookOpen', productivityScore: 3, isDefault: true },
];

const DEFAULT_ISSUE_TYPES = [
    { name: 'Bug Report', defaultPriority: 'Medium', slaResolutionDays: 7, isActive: true },
    { name: 'Feature Request', defaultPriority: 'Low', slaResolutionDays: 30, isActive: true },
    { name: 'Account Issue', defaultPriority: 'High', slaResolutionDays: 2, isActive: true },
    { name: 'Billing', defaultPriority: 'High', slaResolutionDays: 3, isActive: true },
    { name: 'Other', defaultPriority: 'Low', slaResolutionDays: 14, isActive: true },
];

const seedData = async (req, res) => {
    try {
        const existingCategories = await Category.find({});
        const existingIssueTypes = await IssueType.find({});

        if (existingCategories.length === 0) {
            for (const cat of DEFAULT_CATEGORIES) {
                await Category.create(cat);
            }
        }

        if (existingIssueTypes.length === 0) {
            for (const issue of DEFAULT_ISSUE_TYPES) {
                await IssueType.create(issue);
            }
        }

        return res.status(200).json({
            success: true,
            message: 'Seed data applied.',
            data: {
                categoriesCreated: existingCategories.length === 0 ? DEFAULT_CATEGORIES.length : 0,
                issueTypesCreated: existingIssueTypes.length === 0 ? DEFAULT_ISSUE_TYPES.length : 0,
                skippedCategories: existingCategories.length,
                skippedIssueTypes: existingIssueTypes.length,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export { seedData };
