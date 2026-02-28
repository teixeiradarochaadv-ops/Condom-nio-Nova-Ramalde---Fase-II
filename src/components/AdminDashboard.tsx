import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, LogOut, Loader2, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Document {
  id: number;
  filename: string;
  content_length: number;
  created_at: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualText, setManualText] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/admin/documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus({ type: 'success', msg: 'Ficheiro carregado com sucesso!' });
        fetchDocuments();
      } else {
        setUploadStatus({ type: 'error', msg: 'Erro ao carregar ficheiro.' });
      }
    } catch (error) {
      setUploadStatus({ type: 'error', msg: 'Erro de rede.' });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem a certeza que deseja eliminar este documento?')) return;

    try {
      await fetch(`/api/admin/documents/${id}`, { method: 'DELETE' });
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualText) return;

    setIsSavingManual(true);
    try {
      const response = await fetch('/api/admin/upload-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: manualTitle + '.txt', text: manualText }),
      });

      if (response.ok) {
        setUploadStatus({ type: 'success', msg: 'Texto guardado com sucesso!' });
        setShowManualEntry(false);
        setManualTitle('');
        setManualText('');
        fetchDocuments();
      } else {
        setUploadStatus({ type: 'error', msg: 'Erro ao guardar texto.' });
      }
    } catch (error) {
      setUploadStatus({ type: 'error', msg: 'Erro de rede.' });
    } finally {
      setIsSavingManual(false);
      setTimeout(() => setUploadStatus(null), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backoffice</h1>
          <p className="text-neutral-500 mt-1">Gerir documentos de contexto para o assistente</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-sm font-semibold text-neutral-500 hover:text-red-600 transition-colors px-4 py-2 rounded-xl hover:bg-red-50"
        >
          <LogOut size={18} />
          Terminar Sessão
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm sticky top-8">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Plus size={20} className="text-emerald-600" />
              Adicionar Documento
            </h2>
            
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">Opção 1: Carregar Ficheiro</h3>
              <label className="relative group cursor-pointer block">
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.txt"
                  disabled={isUploading}
                />
                <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-8 text-center group-hover:border-emerald-500 group-hover:bg-emerald-50/30 transition-all">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 size={32} className="animate-spin text-emerald-600" />
                      <span className="text-sm font-medium text-neutral-600">A processar...</span>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-semibold text-neutral-700">Escolher PDF/DOCX</p>
                    </>
                  )}
                </div>
              </label>

              <div className="pt-4">
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-3">Opção 2: Colar Texto (Recomendado)</h3>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="w-full py-4 px-6 rounded-2xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-100"
                >
                  <FileText size={18} />
                  COLAR TEXTO DA ATA
                </button>
                <p className="text-[10px] text-neutral-400 mt-2 text-center italic">
                  Use esta opção se o PDF der erro ao carregar.
                </p>
              </div>
            </div>

            <AnimatePresence>
              {uploadStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-xs font-medium ${
                    uploadStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                  }`}
                >
                  {uploadStatus.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {uploadStatus.msg}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-8 border-t border-neutral-100">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-4">Instruções</h3>
              <ul className="space-y-3 text-xs text-neutral-500 leading-relaxed">
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  O assistente apenas responderá com base no texto destes ficheiros.
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  Ficheiros maiores podem demorar alguns segundos a processar.
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 font-bold">•</span>
                  Pode remover ficheiros a qualquer momento para atualizar o contexto.
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="p-6 border-bottom border-neutral-100 flex items-center justify-between">
              <h2 className="text-lg font-bold">Documentos Ativos</h2>
              <span className="bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                {documents.length} Total
              </span>
            </div>

            <div className="divide-y divide-neutral-100">
              {isLoading ? (
                <div className="p-12 text-center">
                  <Loader2 size={32} className="animate-spin text-neutral-300 mx-auto" />
                </div>
              ) : documents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-300">
                    <FileText size={32} />
                  </div>
                  <p className="text-neutral-500 font-medium">Nenhum documento carregado.</p>
                  <p className="text-xs text-neutral-400 mt-1">Adicione o seu primeiro ficheiro para começar.</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-500 group-hover:bg-white transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{doc.filename}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
                            {new Date(doc.created_at).toLocaleDateString('pt-PT')}
                          </p>
                          <span className="text-[10px] text-neutral-300">•</span>
                          <p className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            doc.content_length > 0 ? "text-emerald-500" : "text-red-500"
                          )}>
                            {doc.content_length > 0 ? `${(doc.content_length / 1024).toFixed(1)} KB extraídos` : "Sem texto extraído"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-2 text-neutral-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Eliminar documento"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Manual Entry Modal */}
      <AnimatePresence>
        {showManualEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleManualSubmit}>
                <div className="p-8 border-b border-neutral-100">
                  <h3 className="text-xl font-bold tracking-tight">Introduzir Texto Manualmente</h3>
                  <p className="text-sm text-neutral-500 mt-1">Copie e cole o texto do seu documento aqui.</p>
                </div>
                
                <div className="p-8 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Título do Documento</label>
                    <input
                      type="text"
                      required
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                      placeholder="Ex: Ata de Reunião 2024"
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Conteúdo</label>
                    <textarea
                      required
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="Cole aqui o conteúdo do documento..."
                      rows={12}
                      className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                    />
                  </div>
                </div>
                
                <div className="p-8 bg-neutral-50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowManualEntry(false)}
                    className="px-6 py-2 text-sm font-semibold text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingManual || !manualTitle || !manualText}
                    className="bg-neutral-900 text-white px-8 py-2 rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingManual ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Documento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
