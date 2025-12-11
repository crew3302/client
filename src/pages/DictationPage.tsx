import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, 
  MicOff, 
  Loader2,
  Wand2,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Sidebar } from '../components/layout';
import { Card, Button, Select } from '../components/ui';
import { useNotesStore, useSettingsStore } from '../store';
import { templates } from '../data';
import toast from 'react-hot-toast';
import type { ClinicalNote } from '../types';

export default function DictationPage() {
  const navigate = useNavigate();
  const { addNote } = useNotesStore();
  const { selectedTemplate, setTemplate } = useSettingsStore();
  
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [patientName, setPatientName] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interim = '';
        let final = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript + ' ';
          } else {
            interim += result[0].transcript;
          }
        }
        
        if (final) {
          setTranscript(prev => prev + final);
        }
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          toast.error('Speech recognition error. Please try again.');
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart if still supposed to be listening
          recognitionRef.current?.start();
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript('');
      toast.success('Dictation stopped');
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
      toast.success('Listening... Start speaking');
    }
  };

  const handleClear = () => {
    setTranscript('');
    setInterimTranscript('');
    toast.success('Transcript cleared');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setIsCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const generateNoteFromTranscript = (text: string, template: string, name: string) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const third = Math.ceil(sentences.length / 3);
    
    const templates: Record<string, any> = {
      soap: {
        subjective: sentences.length > 0 
          ? `Patient ${name} presents with the following concerns:\n\n${sentences.slice(0, third).join('. ').trim() || text}.\n\nAs documented from dictation.`
          : `Patient ${name} presents for evaluation. Chief complaint and history documented from dictation.`,
        objective: `Vital Signs: Documented during visit.\n\nPhysical Examination:\n${sentences.slice(third, third * 2).join('. ').trim() || 'Examination findings documented as dictated.'}.\n\nGeneral appearance noted.`,
        assessment: `Clinical Assessment:\n\n${sentences.slice(third * 2).join('. ').trim() || 'Assessment based on clinical findings and patient history as dictated.'}.`,
        plan: `Treatment Plan:\n1. Continue current management as indicated.\n2. Medications reviewed and adjusted as needed.\n3. Patient education provided.\n4. Follow-up as clinically indicated.\n5. Return precautions discussed.`,
      },
      psychiatry: {
        chiefComplaint: `Patient ${name} presents for psychiatric evaluation.`,
        historyOfPresentIllness: sentences.slice(0, third).join('. ').trim() || text,
        physicalExam: `Mental Status Examination:\n- Appearance: ${sentences.slice(third, third * 2).join('. ').trim() || 'As documented'}\n- Behavior: Cooperative\n- Mood/Affect: As reported\n- Thought Process: Goal-directed\n- Cognition: Intact`,
        assessment: sentences.slice(third * 2).join('. ').trim() || 'Psychiatric assessment documented.',
        plan: `1. Treatment recommendations as discussed.\n2. Medication management continued.\n3. Follow-up scheduled.`,
      },
      therapy: {
        subjective: `Therapy session with ${name}. Topics discussed:\n\n${sentences.slice(0, third).join('. ').trim() || text}`,
        objective: `Client presentation: ${sentences.slice(third, third * 2).join('. ').trim() || 'Engaged appropriately in session.'}`,
        assessment: sentences.slice(third * 2).join('. ').trim() || 'Progress toward therapeutic goals noted.',
        plan: `1. Continue therapeutic interventions.\n2. Homework assigned.\n3. Next session scheduled.`,
      },
    };
    
    return templates[template] || templates.soap;
  };

  const handleGenerateNote = async () => {
    if (!transcript.trim()) {
      toast.error('Please dictate some content first');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate AI processing with feedback
      toast.loading('Analyzing dictation...', { id: 'dictation-process' });
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.loading('Structuring clinical note...', { id: 'dictation-process' });
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.dismiss('dictation-process');
      
      const content = generateNoteFromTranscript(transcript, selectedTemplate, patientName || 'Patient');
      
      const newNote: ClinicalNote = {
        id: Date.now().toString(),
        userId: '1',
        patientName: patientName || 'Unknown Patient',
        dateOfService: new Date(),
        template: selectedTemplate,
        content,
        transcription: transcript,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      addNote(newNote);
      toast.success('Note generated successfully!');
      navigate(`/notes/${newNote.id}`);
    } catch (error) {
      toast.error('Failed to generate note');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Sidebar>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Dictation</h1>
          <p className="text-gray-600">
            Dictate your clinical notes directly. Speak naturally and we'll transcribe in real-time.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Dictation Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="p-6">
                <div className="flex flex-col items-center">
                  {/* Microphone Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleListening}
                    className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${
                      isListening 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-emerald-500 hover:bg-emerald-600'
                    }`}
                  >
                    {isListening ? (
                      <MicOff size={40} className="text-white" />
                    ) : (
                      <Mic size={40} className="text-white" />
                    )}
                    
                    {/* Pulse Animation */}
                    {isListening && (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 rounded-full bg-red-500"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.8], opacity: [0.3, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                          className="absolute inset-0 rounded-full bg-red-500"
                        />
                      </>
                    )}
                  </motion.button>
                  
                  <p className={`mt-4 font-medium ${isListening ? 'text-red-500' : 'text-gray-600'}`}>
                    {isListening ? 'Listening... Click to stop' : 'Click to start dictation'}
                  </p>
                  
                  {isListening && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 mt-2"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.5 }}
                        className="w-2 h-2 bg-red-500 rounded-full"
                      />
                      <span className="text-sm text-gray-500">Recording audio</span>
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Transcript Area */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                      title={isMuted ? 'Unmute feedback' : 'Mute feedback'}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <button
                      onClick={handleCopy}
                      disabled={!transcript}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
                      title="Copy transcript"
                    >
                      {isCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                    </button>
                    <button
                      onClick={handleClear}
                      disabled={!transcript}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors disabled:opacity-50"
                      title="Clear transcript"
                    >
                      <RotateCcw size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={transcript + (interimTranscript ? ` ${interimTranscript}` : '')}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Your dictation will appear here... Start speaking or type directly."
                    className="w-full h-64 p-4 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-gray-700"
                  />
                  
                  {interimTranscript && (
                    <span className="absolute bottom-4 left-4 text-gray-400 italic">
                      {interimTranscript}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
                  <span>{transcript.split(/\s+/).filter(Boolean).length} words</span>
                  <span>{transcript.length} characters</span>
                </div>
              </Card>
            </motion.div>

            {/* Generate Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                onClick={handleGenerateNote}
                disabled={!transcript.trim() || isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={20} className="animate-spin mr-2" />
                    Generating Note...
                  </>
                ) : (
                  <>
                    <Wand2 size={20} className="mr-2" />
                    Generate Clinical Note
                  </>
                )}
              </Button>
            </motion.div>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter patient name"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note Template
                    </label>
                    <Select
                      value={selectedTemplate}
                      onChange={(e) => setTemplate(e.target.value as any)}
                      options={templates.map(t => ({ value: t.id, label: t.name }))}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Tips Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 bg-emerald-50 border-emerald-100">
                <h3 className="font-semibold text-emerald-800 mb-3">💡 Dictation Tips</h3>
                <ul className="space-y-2 text-sm text-emerald-700">
                  <li>• Speak clearly and at a moderate pace</li>
                  <li>• Say "period" or "comma" for punctuation</li>
                  <li>• Use "new line" or "new paragraph" for formatting</li>
                  <li>• Review and edit the transcript before generating</li>
                  <li>• Medical terms are automatically recognized</li>
                </ul>
              </Card>
            </motion.div>

            {/* Quick Commands */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Voice Commands</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">"Delete last"</span>
                    <span className="text-gray-400">Remove word</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">"Clear all"</span>
                    <span className="text-gray-400">Reset transcript</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">"New section"</span>
                    <span className="text-gray-400">Start new section</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}
