import React, { useState, useRef, useEffect } from 'react';
import { Receipt, User, Transaction } from '../types';
import { api } from '../services/api';
import {
  ScanLine,
  Camera,
  Upload,
  RotateCw,
  Sliders,
  Check,
  Trash2,
  Download,
  Plus,
  Sparkles,
  FileText,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface CamScannerViewProps {
  user: User;
  onConvertToTransaction: (draft: Partial<Transaction>) => void;
}

export const CamScannerView: React.FC<CamScannerViewProps> = ({
  user,
  onConvertToTransaction,
}) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Active scanning / editing state
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'original' | 'magic' | 'bw' | 'grayscale'>('magic');
  const [processingOcr, setProcessingOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Camera stream state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Multi-page queue
  const [multiPages, setMultiPages] = useState<string[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const currency = user.currency || 'PKR';
  const formatMoney = (amt: number) => {
    return `${currency === 'PKR' ? 'Rs ' : `${currency} `}${Math.round(amt).toLocaleString()}`;
  };

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const res = await api.getReceipts();
      setReceipts(res.data);
    } catch (err: any) {
      console.error('Failed to load receipts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setError('Camera access failed: ' + (err.message || 'Permission denied'));
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleCaptureFromCamera = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('File is too large. Please select an image under 20MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCapturedImage(reader.result as string);
      setOcrResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleProcessOcr = async () => {
    if (!capturedImage) return;
    setProcessingOcr(true);
    setError(null);

    try {
      // Process receipt via API (Gemini OCR)
      const res = await api.processReceipt({
        file_name: `scanned_receipt_${Date.now()}.jpg`,
        file_data_base64: capturedImage,
        mime_type: 'image/jpeg',
        file_size: capturedImage.length,
      });

      setOcrResult(res.ocr);
      fetchReceipts();
    } catch (err: any) {
      setError(err.message || 'OCR processing failed');
    } finally {
      setProcessingOcr(false);
    }
  };

  const handleAddPage = () => {
    if (capturedImage) {
      setMultiPages((prev) => [...prev, capturedImage]);
      setCapturedImage(null);
      setOcrResult(null);
    }
  };

  const handleExportPdfBooklet = () => {
    const pages = multiPages.length > 0 ? multiPages : capturedImage ? [capturedImage] : [];
    if (pages.length === 0) {
      alert('No scanned document pages to export');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Student Budget Manager Pro — Scanned Document', 20, 20);
    doc.setFontSize(10);
    doc.text(`Student: ${user.name} | Date: ${new Date().toLocaleDateString()}`, 20, 28);
    doc.line(20, 32, 190, 32);

    pages.forEach((pageData, index) => {
      if (index > 0) doc.addPage();
      try {
        doc.addImage(pageData, 'JPEG', 20, 40, 170, 220);
      } catch (err) {
        console.error('PDF image add error:', err);
      }
    });

    doc.save(`scanned_receipts_${Date.now()}.pdf`);
  };

  const handleConvertToTransaction = () => {
    if (!ocrResult) return;
    onConvertToTransaction({
      amount: ocrResult.total_amount,
      category: ocrResult.category || 'Food',
      description: `${ocrResult.merchant || 'Scanned Receipt'} - ${ocrResult.date || 'Purchase'}`,
      date: ocrResult.date || new Date().toISOString().split('T')[0],
      merchant: ocrResult.merchant,
      payment_method: 'Cash',
    });
  };

  const handleDeleteReceipt = async (id: string) => {
    if (!confirm('Delete this stored receipt document?')) return;
    try {
      await api.deleteReceipt(id);
      fetchReceipts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete receipt');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              CamScanner Document & Receipt OCR
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Capture cafeteria receipts, hostel bills, and book invoices. Enhance contrast, extract OCR data, and export PDF booklets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {multiPages.length > 0 && (
            <button
              onClick={handleExportPdfBooklet}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {multiPages.length} Pages as PDF</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Scanner Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Camera / Image Editor Canvas */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col items-center justify-center min-h-[380px]">
          {isCameraActive ? (
            <div className="w-full max-w-md relative rounded-2xl overflow-hidden bg-black aspect-[3/4]">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={handleCaptureFromCamera}
                  className="w-16 h-16 rounded-full bg-white ring-4 ring-white/40 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-600" />
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="text-xs font-bold text-white bg-slate-900/80 px-3 py-1.5 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="w-full flex flex-col items-center">
              {/* Image with rotation and filter applied */}
              <div className="relative max-w-md max-h-[420px] rounded-xl overflow-hidden border border-slate-200 bg-slate-900 shadow-sm flex items-center justify-center p-2">
                <img
                  src={capturedImage}
                  alt="Scanned receipt"
                  className={`max-h-[380px] w-auto object-contain transition-all duration-200 ${
                    filterMode === 'magic'
                      ? 'contrast-125 saturate-110 brightness-105'
                      : filterMode === 'bw'
                      ? 'grayscale contrast-200 brightness-95'
                      : filterMode === 'grayscale'
                      ? 'grayscale'
                      : ''
                  }`}
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
              </div>

              {/* Editing Toolbar */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={handleRotate}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Rotate (90°)</span>
                </button>

                {/* Filter presets */}
                <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium">
                  <button
                    onClick={() => setFilterMode('original')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      filterMode === 'original' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setFilterMode('magic')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      filterMode === 'magic' ? 'bg-white font-bold text-indigo-700 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Magic Color
                  </button>
                  <button
                    onClick={() => setFilterMode('bw')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      filterMode === 'bw' ? 'bg-white font-bold text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    B&W Doc
                  </button>
                </div>

                <button
                  onClick={handleAddPage}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add as Page</span>
                </button>

                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setOcrResult(null);
                  }}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Discard</span>
                </button>
              </div>

              {/* Action: Run Gemini OCR */}
              <div className="mt-4 w-full max-w-md">
                <button
                  onClick={handleProcessOcr}
                  disabled={processingOcr}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm shadow-indigo-600/20 disabled:opacity-50 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>{processingOcr ? 'Scanning & Extracting with Gemini OCR...' : 'Run Gemini OCR & Save Document'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Capture or Upload Receipt</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Take a photo using your laptop/phone webcam or upload a bill image to digitize line items.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={startCamera}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xs"
                >
                  <Camera className="w-4 h-4" />
                  <span>Open Live Camera</span>
                </button>

                <label className="w-full sm:w-auto flex items-center justify-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-xl cursor-pointer shadow-xs">
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Upload Image File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: OCR Extraction Review & Multi-Page Tray */}
        <div className="space-y-4">
          {/* Extracted OCR Information Box */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">OCR Extracted Data</h3>
              {ocrResult && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                  {ocrResult.confidence}% Confidence
                </span>
              )}
            </div>

            {ocrResult ? (
              <div className="mt-3 space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Merchant / Store:</span>
                    <strong className="text-slate-900">{ocrResult.merchant}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Bill Amount:</span>
                    <strong className="text-emerald-700 font-extrabold text-sm">
                      {formatMoney(ocrResult.total_amount)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction Date:</span>
                    <span className="text-slate-700">{ocrResult.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Category Detected:</span>
                    <span className="text-indigo-700 font-semibold">{ocrResult.category}</span>
                  </div>
                </div>

                {/* Line items if present */}
                {ocrResult.line_items && ocrResult.line_items.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">
                      Itemized Items:
                    </span>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {ocrResult.line_items.map((it: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between text-[11px] p-1.5 rounded bg-slate-50 text-slate-600"
                        >
                          <span>{it.name}</span>
                          <span className="font-bold text-slate-800">{formatMoney(it.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleConvertToTransaction}
                  className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>Convert to Ledger Transaction</span>
                </button>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Capture or upload a receipt to automatically parse totals, merchants, and dates.
              </div>
            )}
          </div>

          {/* Multi-page booklet queue */}
          {multiPages.length > 0 && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900">
                  Booklet Pages ({multiPages.length})
                </span>
                <button
                  onClick={() => setMultiPages([])}
                  className="text-[10px] text-rose-600 hover:underline"
                >
                  Clear Pages
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto py-1">
                {multiPages.map((pg, idx) => (
                  <div key={idx} className="relative w-14 h-18 rounded border border-slate-200 shrink-0 overflow-hidden">
                    <img src={pg} alt={`Page ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-slate-900/80 text-white text-[9px] px-1 font-bold">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stored Scanned Receipts History */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <h3 className="font-bold text-slate-900 text-sm mb-3">Saved Student Receipts & Documents</h3>

        {receipts.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No receipts stored yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {receipts.map((rc) => (
              <div
                key={rc.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="h-32 w-full rounded-lg overflow-hidden bg-slate-100 mb-2 border border-slate-200 flex items-center justify-center">
                    <img
                      src={rc.file_data_base64}
                      alt={rc.merchant || 'Receipt'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="font-bold text-xs text-slate-900 truncate">
                    {rc.merchant || 'Scanned Bill'}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                    <span>{rc.date || rc.created_at.split('T')[0]}</span>
                    <strong className="text-slate-800">{formatMoney(rc.total_amount || 0)}</strong>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedReceipt(rc)}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>

                  <button
                    onClick={() => handleDeleteReceipt(rc.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full preview modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">{selectedReceipt.merchant || 'Receipt Document'}</h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="py-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-900/5 rounded-xl my-2">
              <img
                src={selectedReceipt.file_data_base64}
                alt="Receipt full"
                className="max-h-[60vh] w-auto object-contain rounded-lg shadow-sm"
              ></img>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100">
              <span>Amount: {formatMoney(selectedReceipt.total_amount || 0)}</span>
              <span>Date: {selectedReceipt.date}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
