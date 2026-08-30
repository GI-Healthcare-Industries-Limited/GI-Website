export const JOB_TITLES = [
  'Technician Intern',
  'Junior Software Developer',
  'General Application',
] as const

// Leave room for multipart form fields under Vercel's 4.5 MB request limit.
export const MAXIMUM_CV_SIZE_BYTES = 4 * 1024 * 1024

export const contactStatuses = ['new', 'in_progress', 'resolved', 'archived'] as const
export const applicationStatuses = ['new', 'reviewing', 'interview', 'rejected', 'hired', 'archived'] as const
