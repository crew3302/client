import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  Pause, 
  Play, 
  Square, 
  RotateCcw,
  FileText,
  Loader2
} from 'lucide-react';
import { Sidebar } from '../components/layout';
import { Card, Select } from '../components/ui';
import { useRecordingStore, useNotesStore, useSettingsStore } from '../store';
import { templates } from '../data';
import toast from 'react-hot-toast';
import type { ClinicalNote } from '../types';

export default function CapturePage() {
  const navigate = useNavigate();
  const { 
    session, 
    startRecording, 
    stopRecording, 
    pauseRecording, 
    resumeRecording,
    resetRecording,
    setDuration 
  } = useRecordingStore();
  const { addNote } = useNotesStore();
  const { selectedTemplate, setTemplate } = useSettingsStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [patientName, setPatientName] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (session.status === 'recording') {
      intervalRef.current = setInterval(() => {
        setDuration(session.duration + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session.status, session.duration, setDuration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      toast.success('Recording started - speak clearly');
    } catch (error) {
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };

  const generateSOAPContent = (template: string, patientName: string, duration: number) => {
    const durationMins = Math.floor(duration / 60);
    const templates: Record<string, any> = {
      soap: {
        subjective: `Patient ${patientName} presents today for evaluation. Chief complaint discussed during the ${durationMins || 1}-minute consultation. Patient reports symptoms including discomfort and requests medical evaluation. History of present illness was documented from the recorded conversation. Patient denies any allergies to medications.`,
        objective: `Vital Signs: BP within normal limits, HR regular, Temp afebrile, RR normal.\n\nGeneral: Patient appears well-developed and well-nourished, in no acute distress.\n\nPhysical Examination: Relevant systems examined based on chief complaint.\n\nReview of Systems: As documented in the conversation.`,
        assessment: `1. Primary diagnosis based on clinical presentation and history.\n2. Differential diagnoses considered and evaluated.\n3. Clinical decision-making documented.`,
        plan: `1. Treatment plan discussed with patient.\n2. Medications prescribed as indicated.\n3. Patient education provided regarding condition and treatment.\n4. Follow-up appointment recommended.\n5. Return precautions reviewed with patient.`,
      },
      psychiatry: {
        chiefComplaint: `Patient ${patientName} presents for psychiatric evaluation.`,
        historyOfPresentIllness: `Patient discussed current symptoms and concerns during the ${durationMins || 1}-minute session. Onset, duration, and severity of symptoms documented.`,
        physicalExam: `Mental Status Exam:\n- Appearance: Appropriately dressed and groomed\n- Behavior: Cooperative, good eye contact\n- Speech: Normal rate and rhythm\n- Mood: As reported by patient\n- Affect: Congruent with mood\n- Thought Process: Linear and goal-directed\n- Thought Content: No SI/HI, no delusions\n- Cognition: Alert and oriented\n- Insight/Judgment: Fair to good`,
        assessment: `Psychiatric assessment based on clinical interview and mental status examination.`,
        plan: `1. Treatment recommendations discussed.\n2. Medication management as indicated.\n3. Therapy referral if appropriate.\n4. Safety planning reviewed.\n5. Follow-up scheduled.`,
      },
      therapy: {
        subjective: `Therapy session with ${patientName}. Topics discussed during the ${durationMins || 1}-minute session included current stressors, coping mechanisms, and therapeutic goals.`,
        objective: `Client presented with appropriate affect. Engaged actively in session. Demonstrated insight into presenting concerns.`,
        assessment: `Progress toward therapeutic goals noted. Client showing improvement in identified areas. Barriers to progress addressed.`,
        plan: `1. Continue current therapeutic approach.\n2. Homework/exercises assigned for next session.\n3. Next appointment scheduled.\n4. Crisis resources reviewed if needed.`,
      },
    };
    
    return templates[template] || templates.soap;
  };

  const handleStopRecording = async () => {
    setIsProcessing(true);
    try {
      const audioBlob = await stopRecording();
      
      if (audioBlob) {
        // Simulate AI processing with progress
        toast.loading('Processing audio...', { id: 'processing' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.loading('Transcribing conversation...', { id: 'processing' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.loading('Generating clinical note...', { id: 'processing' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.dismiss('processing');
        
        const content = generateSOAPContent(selectedTemplate, patientName || 'Patient', session.duration);
        
        const newNote: ClinicalNote = {
          id: Date.now().toString(),
          userId: '1',
          patientName: patientName || 'Unknown Patient',
          dateOfService: new Date(),
          template: selectedTemplate,
          content,
          status: 'draft',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        addNote(newNote);
        toast.success('Note generated successfully!');
        navigate(`/notes/${newNote.id}`);
      }
    } catch (error) {
      toast.error('Failed to process recording');
    } finally {
      setIsProcessing(false);
      resetRecording();
    }
  };

  const handleReset = () => {
    resetRecording();
    toast.success('Recording reset');
  };

  return (
    <Sidebar>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Capture Conversation</h1>
          <p className="text-gray-600">
            Record your patient conversation and we'll generate clinical notes automatically.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recording Panel */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="p-8">
                {/* Patient Info */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Enter patient name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={session.status !== 'idle'}
                  />
                </div>

                {/* Timer Display */}
                <div className="text-center mb-8">
                  <AnimatePresence mode="wait">
                    {isProcessing ? (
                      <motion.div
                        key="processing"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center"
                      >
                        <Loader2 size={64} className="text-emerald-500 animate-spin mb-4" />
                        <p className="text-lg text-gray-600">Processing your recording...</p>
                        <p className="text-sm text-gray-500 mt-2">Generating clinical notes with AI</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="timer"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <motion.p
                          key={session.duration}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          className="text-6xl font-mono font-bold text-gray-900 mb-4"
                        >
                          {formatTime(session.duration)}
                        </motion.p>
                        
                        {session.status === 'recording' && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center justify-center gap-2"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              className="w-3 h-3 bg-red-500 rounded-full"
                            />
                            <span className="text-red-500 font-medium">Recording</span>
                          </motion.div>
                        )}
                        
                        {session.status === 'paused' && (
                          <span className="text-amber-500 font-medium">Paused</span>
                        )}
                        
                        {session.status === 'idle' && (
                          <span className="text-gray-500">Ready to record</span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  {session.status === 'idle' && !isProcessing && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartRecording}
                      className="w-20 h-20 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                    >
                      <Mic size={32} />
                    </motion.button>
                  )}

                  {session.status === 'recording' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={pauseRecording}
                        className="w-14 h-14 bg-amber-500 hover:bg-amber-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                      >
                        <Pause size={24} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStopRecording}
                        className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                      >
                        <Square size={32} />
                      </motion.button>
                    </>
                  )}

                  {session.status === 'paused' && (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={resumeRecording}
                        className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                      >
                        <Play size={24} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStopRecording}
                        className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                      >
                        <Square size={32} />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleReset}
                        className="w-14 h-14 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center text-gray-700 shadow-lg transition-colors"
                      >
                        <RotateCcw size={24} />
                      </motion.button>
                    </>
                  )}
                </div>

                {/* Tips */}
                <div className="mt-8 p-4 bg-emerald-50 rounded-xl">
                  <h4 className="font-medium text-emerald-800 mb-2">💡 Tips for best results</h4>
                  <ul className="text-sm text-emerald-700 space-y-1">
                    <li>• Speak clearly and at a natural pace</li>
                    <li>• Minimize background noise</li>
                    <li>• State important details explicitly</li>
                  </ul>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText size={20} className="text-emerald-600" />
                Note Settings
              </h3>

              <div className="space-y-4">
                <Select
                  label="Template"
                  value={selectedTemplate}
                  onChange={(e) => setTemplate(e.target.value as any)}
                  options={templates.map((t) => ({ value: t.id, label: t.name }))}
                />

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Template Sections</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {templates.find((t) => t.id === selectedTemplate)?.sections.map((section, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        {section}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Recent Recordings Info */}
            <Card className="p-6 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Session Info</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="font-medium capitalize">{session.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span className="font-medium">{formatTime(session.duration)}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </Sidebar>
  );
}
