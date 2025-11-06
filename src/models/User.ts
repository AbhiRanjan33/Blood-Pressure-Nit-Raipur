// models/User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBPReading {
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  sleepQuality: number;     // 1-5
  stressLevel: number;      // 1-5
  notes?: string;
  createdAt: Date;
}

export interface IFitData {
  date: string;
  steps: number;
  heartPoints: number;
  calories: number;
  distance: number;
  moveMinutes: number;
  speed: number;
  createdAt: Date;
}

export interface IPatientProfile {
  name: string;  // ← NEW
  gender: 'male' | 'female' | 'other';
  age: number;
  height: number;
  weight: number;
  smoker: 'yes' | 'no';
  hypertension_treated: 'yes' | 'no';
  family_history_of_cardiovascular_disease: 'yes' | 'no';
  atrial_fibrillation: 'yes' | 'no';
  chronic_kidney_disease: 'yes' | 'no';
  rheumatoid_arthritis: 'yes' | 'no';
  diabetes: 'yes' | 'no';
  chronic_obstructive_pulmonary_disorder: 'yes' | 'no';
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends Document {
  clerkId: string;
  email: string;
  role: 'patient' | 'doctor';
  bpReadings: IBPReading[];
  fitData: IFitData[];
  profile?: IPatientProfile;
  createdAt: Date;
  updatedAt: Date;
}

const BPReadingSchema: Schema = new Schema({
  date: { type: String, required: true },
  time: { type: String, required: true },
  systolic: { type: Number, required: true },
  diastolic: { type: Number, required: true },
  sleepQuality: { type: Number, required: true, min: 1, max: 5 },
  stressLevel: { type: Number, required: true, min: 1, max: 5 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const FitDataSchema: Schema = new Schema({
  date: { type: String, required: true },
  steps: { type: Number, required: true },
  heartPoints: { type: Number, required: true },
  calories: { type: Number, required: true },
  distance: { type: Number, required: true },
  moveMinutes: { type: Number, required: true },
  speed: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

// models/User.ts
const PatientProfileSchema: Schema = new Schema({
  name: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  age: { type: Number, required: true, min: 1, max: 120 },
  height: { type: Number, required: true, min: 100, max: 250 },
  weight: { type: Number, required: true, min: 30, max: 300 },
  smoker: { type: String, enum: ['yes', 'no'], required: true },
  hypertension_treated: { type: String, enum: ['yes', 'no'], required: true },
  family_history_of_cardiovascular_disease: { type: String, enum: ['yes', 'no'], required: true },
  atrial_fibrillation: { type: String, enum: ['yes', 'no'], required: true },
  chronic_kidney_disease: { type: String, enum: ['yes', 'no'], required: true },
  rheumatoid_arthritis: { type: String, enum: ['yes', 'no'], required: true },
  diabetes: { type: String, enum: ['yes', 'no'], required: true },
  chronic_obstructive_pulmonary_disorder: { type: String, enum: ['yes', 'no'], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { strict: false }); // THIS LINE IS THE FIX

const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['patient', 'doctor'], required: true },
  bpReadings: [BPReadingSchema],
  fitData: [FitDataSchema],
  profile: PatientProfileSchema,
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);