import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(120),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const createClassSchema = z.object({
  name: z.string().trim().min(1, "Give the class a name").max(160),
});

export const rosterRowSchema = z.object({
  name: z.string().trim().min(1).max(160),
  rollNumber: z.string().trim().min(1).max(60),
});

export const createSessionSchema = z.object({
  title: z.string().trim().min(1, "Give the session a title").max(160),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().min(5).max(2000),
  startsAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
  endsAt: z.string().datetime({ offset: true }).or(z.string().min(1)),
});

export const markAttendanceSchema = z.object({
  token: z.string().min(1),
  studentId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(100000).optional(),
});
