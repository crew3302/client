import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();

// Initialize Supabase - trim any whitespace from env vars
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
const supabase = createClient(supabaseUrl, supabaseKey);
const jwtSecret = (process.env.JWT_SECRET || 'default-secret-change-me').trim();

// Middleware
app.use(cors({
  origin: (process.env.FRONTEND_URL || '*').trim(),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Auth middleware
interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string };
    req.user = { id: decoded.userId, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Root route
app.get('/', (_req, res) => {
  res.json({ name: 'Pronote API', version: '1.0.0', status: 'running', docs: '/health' });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, specialty } = req.body;
    
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 12);
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        specialty: specialty || null,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
    
    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, specialty: user.specialty },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });
    
    res.json({
      user: { id: user.id, email: user.email, name: user.name, specialty: user.specialty },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

app.get('/api/auth/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, specialty, avatar_url, created_at')
      .eq('id', req.user!.id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Notes routes
app.get('/api/notes', authenticate, async (req: AuthRequest, res) => {
  try {
    const { data: notes, error } = await supabase
      .from('clinical_notes')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json({ notes: notes || [] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notes', authenticate, async (req: AuthRequest, res) => {
  try {
    const { patientName, patientId, dateOfService, template, content, status, transcription } = req.body;
    
    const { data: note, error } = await supabase
      .from('clinical_notes')
      .insert({
        user_id: req.user!.id,
        patient_name: patientName,
        patient_id: patientId,
        date_of_service: dateOfService || new Date().toISOString().split('T')[0],
        template,
        status: status || 'draft',
        transcription,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Insert content sections if provided
    if (content && note) {
      const sections = Object.entries(content)
        .filter(([_, value]) => value)
        .map(([sectionType, text]) => ({
          note_id: note.id,
          section_type: sectionType,
          content: text,
        }));
      
      if (sections.length > 0) {
        await supabase.from('note_sections').insert(sections);
      }
    }
    
    res.status(201).json({ note });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard routes
app.get('/api/dashboard/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [notesResult, todayResult] = await Promise.all([
      supabase.from('clinical_notes').select('id', { count: 'exact' }).eq('user_id', req.user!.id),
      supabase.from('clinical_notes').select('id', { count: 'exact' }).eq('user_id', req.user!.id).gte('created_at', today),
    ]);
    
    res.json({
      totalNotes: notesResult.count || 0,
      todayNotes: todayResult.count || 0,
      totalRecordingMinutes: 0,
      averageProcessingTime: 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}

