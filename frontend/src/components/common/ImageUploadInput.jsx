import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Image as ImageIcon, X, Check, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from './Button';

export const ImageUploadInput = ({
  label = "Upload Image",
  value = "",
  onChange,
  placeholder = "https://images.unsplash.com/...",
  presets = [],
  error,
  helperText,
  className = "",
}) => {
  // Tabs: 'upload' | 'url'
  const [activeTab, setActiveTab] = useState('upload');
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WEBP, SVG).');
      return;
    }
    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size exceeds 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        onChange?.(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleApplyUrl = (urlToApply) => {
    const finalUrl = urlToApply !== undefined ? urlToApply : urlInput;
    onChange?.(finalUrl);
  };

  const handleClear = () => {
    onChange?.('');
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isLocalDataUrl = value && value.startsWith('data:');

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-[#2A1E18] uppercase tracking-wider">
          {label}
        </label>
        {value && (
          <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
            <Check className="w-3 h-3" /> Image Selected
          </span>
        )}
      </div>

      {/* Active Image Preview Box if image exists */}
      {value ? (
        <div className="relative rounded-xl border border-[#E8DCCE] bg-white p-3 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-[#FAF8F5] border border-[#E8DCCE] shrink-0 flex items-center justify-center">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
              }}
            />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
            <div className="text-xs font-bold text-[#2A1E18] flex items-center justify-center sm:justify-start gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#6B4A38]" />
              {isLocalDataUrl ? 'Uploaded from Device' : 'Web Image Link'}
            </div>
            <p className="text-[11px] text-[#7A6A5E] truncate max-w-xs sm:max-w-md">
              {isLocalDataUrl ? 'Local Base64 image data embedded' : value}
            </p>
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Remove
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'upload') {
                    fileInputRef.current?.click();
                  } else {
                    setUrlInput('');
                  }
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-[#6B4A38] hover:text-[#2A1E18] bg-[#FAF8F5] hover:bg-[#E8DCCE]/60 rounded-md border border-[#E8DCCE] transition-colors cursor-pointer"
              >
                Change Image
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Image Selection Tabs & Controls */
        <div className="border border-[#E8DCCE] rounded-xl bg-white overflow-hidden shadow-xs">
          {/* Tabs Selector */}
          <div className="flex border-b border-[#E8DCCE] bg-[#FAF8F5]">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white text-[#6B4A38] border-b-2 border-[#6B4A38]'
                  : 'text-[#7A6A5E] hover:text-[#2A1E18]'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload from Device
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-white text-[#6B4A38] border-b-2 border-[#6B4A38]'
                  : 'text-[#7A6A5E] hover:text-[#2A1E18]'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Paste Image URL
            </button>
          </div>

          <div className="p-4">
            {activeTab === 'upload' ? (
              /* Drag & Drop Upload Zone */
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  className="hidden"
                />
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-[#6B4A38] bg-[#6B4A38]/5 scale-[0.99]'
                      : 'border-[#E8DCCE] hover:border-[#6B4A38] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="w-10 h-10 mx-auto rounded-full bg-[#FAF8F5] border border-[#E8DCCE] flex items-center justify-center text-[#6B4A38] mb-2 shadow-xs">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-[#2A1E18]">
                    Click to browse or drag & drop image
                  </div>
                  <p className="text-[11px] text-[#7A6A5E] mt-1">
                    Supports PNG, JPG, JPEG, WEBP, SVG (Max 5MB)
                  </p>
                </div>
              </div>
            ) : (
              /* Paste URL Form */
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder={placeholder}
                      className="w-full pl-3.5 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#E8DCCE] rounded-lg focus:outline-none focus:border-[#6B4A38]"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    onClick={() => handleApplyUrl()}
                    disabled={!urlInput.trim()}
                  >
                    Apply URL
                  </Button>
                </div>

                {/* Preset Suggestions if available */}
                {presets && presets.length > 0 && (
                  <div className="pt-2 border-t border-[#E8DCCE]/60">
                    <div className="text-[11px] font-semibold text-[#7A6A5E] uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#6B4A38]" /> Quick Preset Images:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {presets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setUrlInput(preset.url);
                            handleApplyUrl(preset.url);
                          }}
                          className="text-left p-1.5 rounded-lg border border-[#E8DCCE] hover:border-[#6B4A38] bg-[#FAF8F5] hover:bg-white transition-all flex items-center gap-2 group cursor-pointer"
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="w-7 h-7 rounded object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-[#2A1E18] group-hover:text-[#6B4A38] truncate">
                              {preset.name}
                            </div>
                            <div className="text-[9px] text-[#7A6A5E] truncate">
                              {preset.category || 'Preset'}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="text-[11px] text-rose-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3" /> {error}
        </div>
      )}
      {helperText && !error && (
        <p className="text-[11px] text-[#7A6A5E]">{helperText}</p>
      )}
    </div>
  );
};
