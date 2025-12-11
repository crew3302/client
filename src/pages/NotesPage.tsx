import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  FileText,
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  Download
} from 'lucide-react';
import { Sidebar } from '../components/layout';
import { Card, Button, Badge, Modal } from '../components/ui';
import { useNotesStore } from '../store';
import { mockRecentNotes } from '../data';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function NotesPage() {
  const { notes, deleteNote } = useNotesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; noteId: string | null }>({
    isOpen: false,
    noteId: null,
  });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const displayNotes = notes.length > 0 ? notes : mockRecentNotes.map(n => ({
    ...n,
    userId: '1',
    content: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  const filteredNotes = displayNotes
    .filter((note: any) => {
      const matchesSearch = note.patientName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || note.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a: any, b: any) => {
      if (sortBy === 'date') {
        return new Date(b.dateOfService).getTime() - new Date(a.dateOfService).getTime();
      }
      return a.patientName?.localeCompare(b.patientName || '') || 0;
    });

  const handleDelete = (id: string) => {
    deleteNote(id);
    setDeleteModal({ isOpen: false, noteId: null });
    toast.success('Note deleted successfully');
  };

  return (
    <Sidebar>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Clinical Notes</h1>
            <p className="text-gray-600">
              Manage and review all your clinical documentation.
            </p>
          </div>
          <Link to="/capture">
            <Button className="w-full sm:w-auto">
              <Plus size={18} className="mr-2" />
              New Note
            </Button>
          </Link>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="signed">Signed</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
              className="px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              aria-label="Sort notes"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </motion.div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notes found</h3>
              <p className="text-gray-500 mb-6">
                {searchQuery ? 'Try adjusting your search or filters' : 'Start by recording or uploading a conversation'}
              </p>
              <Link to="/capture">
                <Button>Create Your First Note</Button>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid gap-4"
          >
            {filteredNotes.map((note: any, index: number) => (
              <motion.div
                key={note.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <Card className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-emerald-600 font-semibold text-lg">
                          {note.patientName?.charAt(0) || 'P'}
                        </span>
                      </div>
                      <div>
                        <Link to={`/notes/${note.id}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
                            {note.patientName}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {format(new Date(note.dateOfService), 'MMM d, yyyy')}
                          </span>
                          <span className="capitalize">{note.template} Note</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={
                          note.status === 'completed' 
                            ? 'success' 
                            : note.status === 'draft' 
                            ? 'warning' 
                            : 'info'
                        }
                      >
                        {note.status}
                      </Badge>
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === note.id ? null : note.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          aria-label="More options"
                        >
                          <MoreVertical size={18} className="text-gray-500" />
                        </button>
                        {activeMenu === note.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 py-1 w-40 z-10"
                          >
                            <Link
                              to={`/notes/${note.id}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              onClick={() => setActiveMenu(null)}
                            >
                              <Edit size={16} />
                              Edit Note
                            </Link>
                            <button
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                              onClick={() => {
                                toast.success('Note exported');
                                setActiveMenu(null);
                              }}
                            >
                              <Download size={16} />
                              Export
                            </button>
                            <button
                              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                              onClick={() => {
                                setDeleteModal({ isOpen: true, noteId: note.id });
                                setActiveMenu(null);
                              }}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, noteId: null })}
          title="Delete Note"
        >
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this note? This action cannot be undone.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, noteId: null })}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              onClick={() => deleteModal.noteId && handleDelete(deleteModal.noteId)}
            >
              Delete
            </Button>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}
