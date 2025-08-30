import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30).optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Story validation schemas
export const createStorySchema = z.object({
  title: z.record(z.string().min(1, 'Title is required')).refine(
    obj => Object.keys(obj).length > 0,
    { message: "Title must have at least one language" }
  ),
  shortDescription: z.record(z.string().min(1, 'Description is required')).refine(
    obj => Object.keys(obj).length > 0,
    { message: "Description must have at least one language" }
  ),
  content: z.record(z.array(z.string().min(1))).refine(
    obj => Object.keys(obj).length > 0 && Object.values(obj).every(arr => arr.length > 0),
    { message: "Content must have at least one paragraph in at least one language" }
  ),
  categoryIds: z.array(z.string().uuid()).optional(),
  tagIds: z.array(z.string().uuid()).optional(),
  authorIds: z.array(z.object({
    id: z.string().uuid(),
    role: z.enum(['author', 'co-author', 'translator']).default('author')
  })).optional(),
  seriesId: z.string().uuid().optional(),
  orderInSeries: z.number().int().min(1).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  editorRating: z.number().min(0).max(5).optional(),
  sourceInfo: z.object({
    siteName: z.string().optional(),
    originalUrl: z.string().url().optional(),
    scrapedAt: z.string().optional(),
    translator: z.string().optional()
  }).optional()
});

export const updateStorySchema = createStorySchema.partial();

// Rating validation
export const ratingSchema = z.object({
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').multipleOf(0.5)
});

// Progress validation
export const progressSchema = z.object({
  lastParagraph: z.number().int().min(0).optional(),
  status: z.enum(['STARTED', 'COMPLETED'])
});

// Search and filter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export const storyFilterSchema = paginationSchema.extend({
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  seriesId: z.string().uuid().optional(),
  language: z.enum(['en', 'tr']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional()
});

// Author validation schemas
export const createAuthorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  bio: z.record(z.string()).optional()
});

export const updateAuthorSchema = createAuthorSchema.partial();

// Category validation schemas  
export const createCategorySchema = z.object({
  name: z.record(z.string().min(1, 'Name is required')).refine(
    obj => Object.keys(obj).length > 0,
    { message: "Name must have at least one language" }
  ),
  description: z.record(z.string()).optional()
});

export const updateCategorySchema = createCategorySchema.partial();

// Tag validation schemas
export const createTagSchema = z.object({
  name: z.record(z.string().min(1, 'Name is required')).refine(
    obj => Object.keys(obj).length > 0,
    { message: "Name must have at least one language" }
  ),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional()
});

export const updateTagSchema = createTagSchema.partial();

// Series validation schemas
export const createSeriesSchema = z.object({
  name: z.record(z.string().min(1, 'Name is required')).refine(
    obj => Object.keys(obj).length > 0,
    { message: "Name must have at least one language" }
  ),
  description: z.record(z.string()).optional()
});

export const updateSeriesSchema = createSeriesSchema.partial();

// Form validation helpers
export const validateForm = async <T>(schema: z.ZodSchema<T>, data: unknown): Promise<{
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
}> => {
  try {
    const validData = await schema.parseAsync(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Custom validation rules
export const customValidations = {
  slug: z.string().regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must contain only lowercase letters, numbers, and hyphens'
  ),
  
  multilingualContent: (required: boolean = true) => {
    const baseSchema = z.record(z.string());
    return required 
      ? baseSchema.refine(obj => Object.keys(obj).length > 0, {
          message: "At least one language is required"
        })
      : baseSchema.optional();
  },

  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number'),

  strongPassword: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character'),

  fileSize: (maxSizeMB: number) => z.number().max(
    maxSizeMB * 1024 * 1024,
    `File size must not exceed ${maxSizeMB}MB`
  ),

  imageFile: z.object({
    name: z.string(),
    type: z.string().regex(/^image\/(jpeg|jpg|png|gif|webp)$/, 'Invalid image format'),
    size: z.number().max(5 * 1024 * 1024, 'Image size must not exceed 5MB')
  })
};

// Type exports for form data
export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type CreateStoryFormData = z.infer<typeof createStorySchema>;
export type UpdateStoryFormData = z.infer<typeof updateStorySchema>;
export type RatingFormData = z.infer<typeof ratingSchema>;
export type ProgressFormData = z.infer<typeof progressSchema>;
export type StoryFilterFormData = z.infer<typeof storyFilterSchema>;
export type CreateAuthorFormData = z.infer<typeof createAuthorSchema>;
export type CreateCategoryFormData = z.infer<typeof createCategorySchema>;
export type CreateTagFormData = z.infer<typeof createTagSchema>;
export type CreateSeriesFormData = z.infer<typeof createSeriesSchema>;