
import React, { useState, useEffect } from 'react';
import { 
  Upload, Palette, Image as ImageIcon, 
  Library, Wand2, ShoppingBag, Flag, ScanEye, 
  Zap, Shirt, User, Box, Building2, Baby, 
  History, Sun, Sparkles, PaintBucket, Settings, X, Loader2, Download, Copy, Search, RefreshCw, Edit3, ArrowLeftRight
} from 'lucide-react';
import type { Feature, HistoryItem, ApiResponse, GenerationOptions, PromptSample } from './types';

// --- Constants ---
const THEMES = { BLUE: 'blue', GREEN: 'green' };

const STYLES = [
  { id: 'photorealistic', name: 'Siêu thực', prompt: 'photorealistic, 8k, highly detailed, raw photo' },
  { id: 'anime', name: 'Anime', prompt: 'anime style, vibrant colors, expressive eyes' },
  { id: 'chibi', name: 'Chibi', prompt: 'chibi style, cute, large head, small body, simple details' },
  { id: '3d-render', name: '3D Render', prompt: '3d render, octane render, unreal engine 5, cinematic lighting' },
  { id: 'painting', name: 'Tranh vẽ tay', prompt: 'hand-painted, artistic brushstrokes, textured' },
  { id: 'flat', name: 'Minh họa phẳng', prompt: 'flat illustration, vector art, minimalist' },
];

const PROMPT_LIB: PromptSample[] = [
  { id: 'p1', category: 'Chân dung', title: 'Cyberpunk Girl', content: 'Cyberpunk woman with neon tattoos, cinematic lighting, purple and blue atmosphere' },
  { id: 'p2', category: 'Sản phẩm', title: 'Luxury Watch', content: 'Luxury watch on a dark marble surface, water droplets, macro photography, elegant lighting' },
  { id: 'p3', category: 'Kiến trúc', title: 'Eco Mansion', content: 'Modern eco-friendly mansion in the forest, glass walls, waterfall, sunlight through trees' },
  { id: 'p4', category: 'Chibi', title: 'Chibi Samurai', content: 'Cute chibi samurai holding a tiny katana, traditional armor, blossoming cherry trees' },
  { id: 'p5', category: 'Anime', title: 'Sky Castle', content: 'Ghibli style flying castle in the clouds, blue sky, lush greenery, nostalgic' },
];

const FEATURES: Feature[] = [
  { id: 'txt2img', name: 'Tạo ảnh tự do', icon: Wand2, description: 'Biến văn bản thành hình ảnh nghệ thuật.', type: 'text-to-image' },
  { id: 'product', name: 'Ảnh sản phẩm', icon: ShoppingBag, description: 'Tạo background chuyên nghiệp cho sản phẩm.', type: 'image-to-image' },
  { id: 'avatar', name: 'Avatar yêu nước', icon: Flag, description: 'Phong cách cờ đỏ sao vàng tự hào.', type: 'text-to-image' },
  { id: 'analyze', name: 'Phân tích ảnh', icon: ScanEye, description: 'AI đọc và mô tả nội dung bức ảnh.', type: 'analysis' },
  { id: 'try-on', name: 'Mặc trang phục', icon: Shirt, description: 'Thử quần áo ảo, giữ nguyên gương mặt.', type: 'face-consistency', requiresFaceRef: true },
  { id: 'chibi', name: 'Nhân vật Chibi', icon: User, description: 'Biến người thật thành Chibi dễ thương.', type: 'face-consistency', requiresFaceRef: true },
  { id: 'realism', name: 'Chuyển ảnh thật', icon: ImageIcon, description: 'Biến ảnh vẽ thành ảnh tả thực.', type: 'face-consistency', requiresFaceRef: true },
  { id: 'restore', name: 'Phục chế ảnh cũ', icon: History, description: 'Làm nét và tô màu ảnh đen trắng.', type: 'image-to-image' },
  { id: 'backlight', name: 'Ảnh ngược sáng', icon: Sun, description: 'Tạo hiệu ứng ánh sáng nghệ thuật.', type: 'face-consistency', requiresFaceRef: true },
  { id: 'style-swap', name: 'Đổi style ảnh', icon: PaintBucket, description: 'Áp dụng phong cách nghệ thuật khác.', type: 'face-consistency', requiresFaceRef: true },
  { id: 'arch', name: 'Kiến trúc', icon: Building2, description: 'Ý tưởng thiết kế kiến trúc nội thất.', type: 'text-to-image' },
  { id: 'baby', name: 'Tạo ảnh cho bé', icon: Baby, description: 'Concept dễ thương, giữ nét mặt bé.', type: 'face-consistency', requiresFaceRef: true },
  { id: '3d-model', name: 'Tạo mô hình 3D', icon: Box, description: 'Tạo asset 3D style từ mô tả.', type: 'text-to-image' },
];

function App() {
  // --- UI States ---
  const [theme, setTheme] = useState(THEMES.BLUE);
  const [view, setView] = useState<'home' | 'prompt-lib' | 'editor'>('home');
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  
  // --- Form States ---
  const [prompt, setPrompt] = useState('');
  const [faceRefImage, setFaceRefImage] = useState<File | null>(null);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [options, setOptions] = useState<GenerationOptions>({
    aspectRatio: '1:1',
    resolution: '1024x1024',
    style: 'photorealistic'
  });

  // --- Logic States ---
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const accentText = theme === THEMES.BLUE ? 'text-cyan-400' : 'text-lime-400';
  const accentBorder = theme === THEMES.BLUE ? 'border-cyan-500' : 'border-lime-500';
  const accentBg = theme === THEMES.BLUE ? 'bg-cyan-500' : 'bg-lime-500';

  // --- Handlers ---
  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setError(null);
    setResult(null);
    setShowComparison(false);
    // Nếu chuyển từ Prompt Lib sang, ta giữ nguyên prompt hiện có
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedFeature) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const faceBase64 = faceRefImage ? await fileToBase64(faceRefImage) : '';
      const sourceBase64 = sourceImage ? await fileToBase64(sourceImage) : '';

      const response = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_id: selectedFeature.id,
          prompt,
          face_ref: faceBase64,
          source_img: sourceBase64,
          options
        }),
      });

      const data: ApiResponse = await response.json();
      if (!data.success) throw new Error(data.error || 'Lỗi từ AI Server');

      const finalUrl = data.data?.image_url || data.data?.image_base64;
      if (selectedFeature.type === 'analysis') {
        setResult(data.data?.analysis_text || 'Không có phản hồi.');
      } else if (finalUrl) {
        setResult(finalUrl);
        const newHistoryItem: HistoryItem = {
          id: Date.now().toString(),
          url: finalUrl,
          prompt,
          type: selectedFeature.name,
          originalUrl: sourceBase64 || faceBase64
        };
        setHistory(prev => [newHistoryItem, ...prev].slice(0, 10));
      }
    } catch (err: any) {
      setError(err.message || 'Có lỗi khi gọi Google AI. Vui lòng kiểm tra lại API key hoặc thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Đã sao chép prompt!');
  };

  const usePrompt = (sample: PromptSample) => {
    setPrompt(sample.content);
    setView('home');
    // Nếu chưa chọn tính năng, gợi ý chọn tạo ảnh tự do
    if (!selectedFeature) setSelectedFeature(FEATURES[0]);
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `caotrang-ai-${Date.now()}.png`;
    link.click();
  };

  // --- Renders ---
  return (
    <div className="min-h-screen bg-gray-950 text-white font-body pb-10">
      {/* Background Glow */}
      <div className={`fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_-20%,${theme === THEMES.BLUE ? '#06b6d4' : '#84cc16'},transparent_50%)]`}></div>

      {/* Navigation */}
      <nav className="relative z-20 glass border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className={`text-2xl font-display font-black tracking-tighter ${accentText} cursor-pointer`} onClick={() => setView('home')}>
            CAOTRANG <span className="text-white">AI STUDIO</span>
          </h1>
          <div className="hidden md:flex gap-4 ml-8">
             <button onClick={() => setView('home')} className={`text-sm font-bold ${view === 'home' ? accentText : 'text-gray-400'}`}>DASHBOARD</button>
             <button onClick={() => setView('prompt-lib')} className={`text-sm font-bold ${view === 'prompt-lib' ? accentText : 'text-gray-400'}`}>THƯ VIỆN PROMPT</button>
             <button onClick={() => setView('editor')} className={`text-sm font-bold ${view === 'editor' ? accentText : 'text-gray-400'}`}>IMAGE EDITOR</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={() => setTheme(theme === THEMES.BLUE ? THEMES.GREEN : THEMES.BLUE)} className="p-2 rounded-lg bg-gray-900 border border-gray-800 hover:border-gray-600 transition">
              <Settings className="w-5 h-5" />
           </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 pt-8 relative z-10">
        
        {view === 'home' && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-display font-bold mb-2">Xin chào, nhà sáng tạo!</h2>
              <p className="text-gray-400">Chọn một tính năng bên dưới để bắt đầu biến ý tưởng thành hiện thực.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {FEATURES.map((f) => (
                <div 
                  key={f.id} 
                  onClick={() => handleFeatureClick(f)}
                  className={`group p-6 glass rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 
                    ${selectedFeature?.id === f.id ? `${accentBorder} bg-gray-800/80` : 'border-gray-800 hover:border-gray-600'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition ${selectedFeature?.id === f.id ? accentBg : 'bg-gray-900 text-gray-400'}`}>
                    <f.icon className={`w-6 h-6 ${selectedFeature?.id === f.id ? 'text-black' : ''}`} />
                  </div>
                  <h3 className="font-bold mb-1">{f.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{f.description}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {view === 'prompt-lib' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-3xl font-display font-bold">Thư viện Prompt</h2>
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Tìm kiếm prompt..." 
                  className="w-full bg-gray-900 border border-gray-800 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PROMPT_LIB.filter(p => p.content.toLowerCase().includes(searchTerm.toLowerCase())).map(sample => (
                <div key={sample.id} className="glass p-6 rounded-2xl border border-gray-800 hover:border-gray-600 transition flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] uppercase font-black px-2 py-1 rounded bg-gray-800 ${accentText}`}>{sample.category}</span>
                    <button onClick={() => copyToClipboard(sample.content)} className="text-gray-500 hover:text-white transition"><Copy className="w-4 h-4" /></button>
                  </div>
                  <h4 className="font-bold mb-2">{sample.title}</h4>
                  <p className="text-sm text-gray-400 mb-6 flex-grow italic">"{sample.content}"</p>
                  <button 
                    onClick={() => usePrompt(sample)}
                    className={`w-full py-2 rounded-lg text-xs font-bold uppercase transition ${accentBg} text-black hover:opacity-90`}
                  >
                    Sử dụng ngay
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'editor' && (
           <div className="flex flex-col items-center justify-center py-20 glass rounded-3xl border border-dashed border-gray-700">
              <Palette className="w-20 h-20 text-gray-700 mb-4" />
              <h3 className="text-2xl font-bold mb-2 text-gray-400">Image Editor</h3>
              <p className="text-gray-500">Tính năng đang được phát triển. Bạn có thể chỉnh sửa các ảnh đã tạo tại đây.</p>
           </div>
        )}
      </main>

      {/* Modal Tính Năng */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className={`relative w-full max-w-5xl bg-gray-950 rounded-3xl border ${accentBorder} shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col md:flex-row overflow-hidden max-h-[90vh]`}>
            
            <button onClick={() => setSelectedFeature(null)} className="absolute top-4 right-4 p-2 rounded-full bg-gray-900 text-gray-400 hover:text-white z-50">
              <X className="w-6 h-6" />
            </button>

            {/* Panel Nhập liệu */}
            <div className="w-full md:w-[450px] p-8 border-b md:border-b-0 md:border-r border-gray-800 overflow-y-auto">
              <div className="flex items-center gap-3 mb-6">
                <selectedFeature.icon className={`w-6 h-6 ${accentText}`} />
                <h2 className="text-xl font-display font-bold">{selectedFeature.name}</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Ảnh tham chiếu gương mặt */}
                {selectedFeature.requiresFaceRef && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-500 tracking-widest flex justify-between">
                       <span>Ảnh tham chiếu mặt</span>
                       <span className={accentText}>Bắt buộc</span>
                    </label>
                    <div className="relative border-2 border-dashed border-gray-800 rounded-2xl p-4 bg-gray-900/50 hover:border-gray-600 transition group">
                      <input type="file" accept="image/*" onChange={(e) => e.target.files && setFaceRefImage(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                      {faceRefImage ? (
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded bg-gray-800 overflow-hidden"><img src={URL.createObjectURL(faceRefImage)} className="w-full h-full object-cover" alt="ref" /></div>
                           <span className="text-xs truncate max-w-[150px]">{faceRefImage.name}</span>
                        </div>
                      ) : (
                        <div className="text-center py-2 text-gray-500 text-xs">
                          <Upload className="w-5 h-5 mx-auto mb-1 opacity-50" />
                          <p>Tải ảnh chân dung rõ nét</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ảnh gốc (cho img2img) */}
                {(selectedFeature.type === 'image-to-image' || selectedFeature.type === 'analysis') && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-500 tracking-widest">Ảnh đầu vào</label>
                    <div className="relative border-2 border-dashed border-gray-800 rounded-2xl p-4 bg-gray-900/50 hover:border-gray-600 transition">
                      <input type="file" accept="image/*" onChange={(e) => e.target.files && setSourceImage(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" />
                      {sourceImage ? (
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-12 rounded bg-gray-800 overflow-hidden"><img src={URL.createObjectURL(sourceImage)} className="w-full h-full object-cover" alt="source" /></div>
                           <span className="text-xs truncate max-w-[150px]">{sourceImage.name}</span>
                        </div>
                      ) : (
                        <div className="text-center py-2 text-gray-500 text-xs">
                          <ImageIcon className="w-5 h-5 mx-auto mb-1 opacity-50" />
                          <p>Tải ảnh cần chỉnh sửa</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Prompt Input */}
                {selectedFeature.type !== 'analysis' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-500 tracking-widest">Mô tả (Prompt)</label>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Mô tả phong cách, bối cảnh, trang phục..."
                      className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-500 min-h-[100px] resize-none"
                    />
                    {/* Gợi ý prompt */}
                    <div className="flex flex-wrap gap-2 mt-2">
                       <button type="button" onClick={() => setPrompt("Ánh sáng cinematic, background thành phố tương lai")} className="text-[10px] bg-gray-900 border border-gray-800 px-2 py-1 rounded hover:border-gray-600">Bối cảnh Cyberpunk</button>
                       <button type="button" onClick={() => setPrompt("Phong cách tối giản, studio, ánh sáng mềm")} className="text-[10px] bg-gray-900 border border-gray-800 px-2 py-1 rounded hover:border-gray-600">Chụp Studio</button>
                    </div>
                  </div>
                )}

                {/* Options Grid */}
                {selectedFeature.type !== 'analysis' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500">Tỉ lệ</label>
                      <select 
                        value={options.aspectRatio}
                        onChange={(e) => setOptions({...options, aspectRatio: e.target.value as any})}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 px-3 text-xs focus:outline-none"
                      >
                        <option value="1:1">1:1 (Vuông)</option>
                        <option value="9:16">9:16 (Dọc)</option>
                        <option value="16:9">16:9 (Ngang)</option>
                        <option value="3:4">3:4</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-500">Độ phân giải</label>
                      <select 
                        value={options.resolution}
                        onChange={(e) => setOptions({...options, resolution: e.target.value as any})}
                        className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 px-3 text-xs focus:outline-none"
                      >
                        <option value="512x512">512px (Nhanh)</option>
                        <option value="768x768">768px</option>
                        <option value="1024x1024">1024px (HD)</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedFeature.type !== 'analysis' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest">Phong cách</label>
                    <div className="grid grid-cols-3 gap-2">
                       {STYLES.map(s => (
                         <button 
                          key={s.id}
                          type="button"
                          onClick={() => setOptions({...options, style: s.id})}
                          className={`text-[10px] py-2 rounded-lg border transition ${options.style === s.id ? accentBorder + ' ' + accentText : 'border-gray-800 text-gray-500'}`}
                         >
                           {s.name}
                         </button>
                       ))}
                    </div>
                  </div>
                )}

                <button 
                  disabled={loading}
                  className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition shadow-xl
                    ${loading ? 'bg-gray-800 text-gray-500' : `${accentBg} text-black hover:scale-[1.02] active:scale-[0.98]`}`}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> {selectedFeature.type === 'analysis' ? 'PHÂN TÍCH' : 'TẠO ẢNH NGAY'}</>}
                </button>

                {error && <div className="p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-400 text-xs text-center">{error}</div>}
              </form>
            </div>

            {/* Panel Kết quả */}
            <div className="flex-grow p-8 bg-black/40 flex flex-col min-h-[400px]">
              <div className="flex-grow flex items-center justify-center relative group">
                {result ? (
                  <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in duration-300">
                    {selectedFeature.type === 'analysis' ? (
                      <div className="max-w-md w-full glass p-8 rounded-3xl border border-gray-800">
                         <h4 className="text-lg font-bold mb-4 flex items-center gap-2"><ScanEye className={accentText} /> Kết quả:</h4>
                         <p className="text-gray-300 leading-relaxed italic">{result}</p>
                      </div>
                    ) : (
                      <div className="w-full h-full relative overflow-hidden rounded-2xl border border-gray-800">
                        {showComparison && (sourceImage || faceRefImage) ? (
                           <div className="absolute inset-0 grid grid-cols-2">
                              <div className="relative">
                                 <img src={sourceImage ? URL.createObjectURL(sourceImage) : (faceRefImage ? URL.createObjectURL(faceRefImage) : '')} className="w-full h-full object-contain bg-gray-900" alt="before" />
                                 <span className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-[10px] rounded">TRƯỚC</span>
                              </div>
                              <div className="relative border-l border-gray-800">
                                 <img src={result} className="w-full h-full object-contain bg-gray-900" alt="after" />
                                 <span className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-[10px] rounded">SAU</span>
                              </div>
                           </div>
                        ) : (
                          <img src={result} className="w-full h-full object-contain" alt="result" />
                        )}
                        
                        {/* Overlay Controls */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 opacity-0 group-hover:opacity-100 transition translate-y-2 group-hover:translate-y-0">
                           <button onClick={() => downloadImage(result!)} className="p-3 rounded-full glass hover:bg-white/10 text-white shadow-2xl" title="Tải về"><Download className="w-5 h-5" /></button>
                           {(sourceImage || faceRefImage) && (
                             <button onClick={() => setShowComparison(!showComparison)} className={`p-3 rounded-full glass hover:bg-white/10 shadow-2xl ${showComparison ? accentText : 'text-white'}`} title="So sánh"><ArrowLeftRight className="w-5 h-5" /></button>
                           )}
                           <button onClick={() => setView('editor')} className="p-3 rounded-full glass hover:bg-white/10 text-white shadow-2xl" title="Mở trong Editor"><Edit3 className="w-5 h-5" /></button>
                           <button onClick={() => handleSubmit()} className="p-3 rounded-full glass hover:bg-white/10 text-white shadow-2xl" title="Tạo lại"><RefreshCw className="w-5 h-5" /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center opacity-20">
                    <ImageIcon className="w-24 h-24 mx-auto mb-4" />
                    <p className="font-display uppercase tracking-widest text-sm">Đang chờ tín hiệu...</p>
                  </div>
                )}
              </div>
              
              {result && selectedFeature.type !== 'analysis' && (
                <div className="mt-6 flex justify-center gap-8 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                   <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> AI GENERATED</div>
                   <div>MODEL: GEMINI-2.5-FLASH</div>
                   <div>RESOLUTION: {options.resolution}</div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* History (Sticky Bar) */}
      {history.length > 0 && view === 'home' && (
        <div className="fixed bottom-0 left-0 w-full z-40 glass border-t border-gray-800 p-4 transform translate-y-0 transition animate-in slide-in-from-bottom duration-500">
           <div className="container mx-auto flex items-center gap-6 overflow-x-auto no-scrollbar">
              <div className="flex-shrink-0 border-r border-gray-800 pr-4">
                 <h4 className="text-[10px] font-black uppercase text-gray-500 mb-1">Gần đây</h4>
                 <div className="flex gap-1">
                    <History className="w-3 h-3 text-gray-600" />
                    <span className="text-[9px] text-gray-600">{history.length} ẢNH</span>
                 </div>
              </div>
              {history.map(item => (
                <div key={item.id} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-800 group cursor-pointer flex-shrink-0" onClick={() => {setResult(item.url); setSelectedFeature(FEATURES[0])}}>
                   <img src={item.url} className="w-full h-full object-cover" alt="h" />
                   <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover:opacity-100 transition"></div>
                </div>
              ))}
           </div>
        </div>
      )}

    </div>
  );
}

export default App;
