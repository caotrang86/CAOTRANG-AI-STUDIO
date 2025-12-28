import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Palette, Image as ImageIcon, 
  Library, Wand2, ShoppingBag, Flag, ScanEye, 
  Zap, Shirt, User, Box, Building2, Baby, 
  History, Sun, Sparkles, PaintBucket, Settings, X, Loader2, Download
} from 'lucide-react';
import type { Feature, HistoryItem, ApiResponse } from './types';

// --- Constants & Config ---
const THEMES = {
  BLUE: 'blue',
  GREEN: 'green'
};

const FEATURES: Feature[] = [
  { id: 'prompt-lib', name: 'Thư viện prompt', icon: Library, description: 'Khám phá các mẫu câu lệnh tối ưu.', type: 'prompt-lib' },
  { id: 'txt2img', name: 'Tạo ảnh tự do', icon: Wand2, description: 'Biến văn bản thành hình ảnh nghệ thuật.', type: 'text-to-image' },
  { id: 'product', name: 'Ảnh sản phẩm', icon: ShoppingBag, description: 'Tạo background chuyên nghiệp cho sản phẩm.', type: 'text-to-image' },
  { id: 'avatar', name: 'Avatar yêu nước', icon: Flag, description: 'Tạo avatar với phong cách cờ đỏ sao vàng.', type: 'text-to-image' },
  { id: 'analyze', name: 'Phân tích ảnh', icon: ScanEye, description: 'AI đọc và mô tả nội dung bức ảnh của bạn.', type: 'analysis' },
  { id: 'interpolate', name: 'Nội suy hình ảnh', icon: Zap, description: 'Mở rộng khung hình hoặc biến đổi giữa 2 ảnh.', type: 'image-to-image' },
  { id: 'try-on', name: 'Mặc trang phục', icon: Shirt, description: 'Thử quần áo ảo lên người mẫu.', type: 'image-to-image' },
  { id: 'remove-cloth', name: 'Tách trang phục', icon: Shirt, description: 'Tách layer quần áo để thiết kế.', type: 'image-to-image' },
  { id: 'chibi', name: 'Nhân vật Chibi', icon: User, description: 'Chuyển ảnh thật thành phong cách Chibi dễ thương.', type: 'text-to-image' },
  { id: '3d-model', name: 'Tạo mô hình', icon: Box, description: 'Tạo asset 3D style từ mô tả.', type: 'text-to-image' },
  { id: 'arch', name: 'Kiến trúc', icon: Building2, description: 'Ý tưởng thiết kế kiến trúc và nội thất.', type: 'text-to-image' },
  { id: 'baby', name: 'Tạo ảnh cho bé', icon: Baby, description: 'Tạo ảnh concept dễ thương cho trẻ em.', type: 'text-to-image' },
  { id: 'restore', name: 'Phục chế ảnh cũ', icon: History, description: 'Làm nét và tô màu ảnh đen trắng.', type: 'image-to-image' },
  { id: 'realism', name: 'Chuyển ảnh thật', icon: ImageIcon, description: 'Biến ảnh vẽ thành ảnh tả thực.', type: 'image-to-image' },
  { id: 'backlight', name: 'Ảnh ngược sáng', icon: Sun, description: 'Tạo hiệu ứng ánh sáng nghệ thuật.', type: 'image-to-image' },
  { id: 'style-swap', name: 'Đổi style ảnh', icon: PaintBucket, description: 'Áp dụng phong cách nghệ thuật khác.', type: 'image-to-image' },
  { id: 'mix-style', name: 'Trộn style ảnh', icon: Sparkles, description: 'Kết hợp nhiều phong cách vào một ảnh.', type: 'image-to-image' },
];

function App() {
  // --- State ---
  const [theme, setTheme] = useState(THEMES.BLUE);
  const [neonEnabled, setNeonEnabled] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Form State
  const [prompt, setPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('caotrang_theme');
    if (savedTheme) setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === THEMES.BLUE ? THEMES.GREEN : THEMES.BLUE;
    setTheme(newTheme);
    localStorage.setItem('caotrang_theme', newTheme);
  };

  // --- Handlers ---
  const handleFeatureClick = (feature: Feature) => {
    setSelectedFeature(feature);
    setPrompt('');
    setSelectedImage(null);
    setResult(null);
    setError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFeature) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Prepare payload
      // Note: We send JSON to Backend to keep it simple and compatible with Netlify Functions without complex multipart parsers.
      // We convert the file to Base64 on the client side.
      let imageBase64 = '';
      if (selectedImage) {
        imageBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedImage);
        });
      }

      const payload = {
        model: 'banana-pro', // Identifier for backend
        feature_id: selectedFeature.id,
        prompt: prompt,
        image_base64: imageBase64,
        width: 1024,
        height: 1024
      };

      const response = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: ApiResponse = await response.json();

      if (!data.success || data.error) {
        throw new Error(data.error || 'Đã có lỗi xảy ra khi gọi API');
      }

      // Handle Success
      const resultUrl = data.data?.image_url || data.data?.image_base64 || '';
      const resultText = data.data?.analysis_text;

      if (selectedFeature.type === 'analysis') {
         // Special handling for text result if needed, currently we just show text
         setResult(resultText || "Không có kết quả phân tích.");
      } else {
         setResult(resultUrl);
         // Add to history
         if (resultUrl) {
           setHistory(prev => [{
             id: Date.now().toString(),
             url: resultUrl,
             prompt: prompt.substring(0, 30) + '...',
             type: selectedFeature.name
           }, ...prev].slice(0, 5));
         }
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Lỗi kết nối đến máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  // --- Styles ---
  const accentColor = theme === THEMES.BLUE ? 'cyan' : 'lime';
  const accentText = theme === THEMES.BLUE ? 'text-cyan-400' : 'text-lime-400';
  const accentBorder = theme === THEMES.BLUE ? 'border-cyan-500' : 'border-lime-500';
  const accentBg = theme === THEMES.BLUE ? 'bg-cyan-500' : 'bg-lime-500';
  const glowClass = neonEnabled ? (theme === THEMES.BLUE ? 'shadow-neon-blue' : 'shadow-neon-green') : '';

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-gray-950 font-body">
      
      {/* Background Decor */}
      <div className={`fixed top-0 left-1/4 w-96 h-96 ${theme === THEMES.BLUE ? 'bg-blue-600' : 'bg-green-600'} rounded-full blur-[120px] opacity-10 pointer-events-none`}></div>
      <div className={`fixed bottom-0 right-1/4 w-96 h-96 ${theme === THEMES.BLUE ? 'bg-purple-600' : 'bg-yellow-600'} rounded-full blur-[120px] opacity-10 pointer-events-none`}></div>

      {/* HEADER */}
      <header className="relative z-10 pt-8 pb-6 text-center px-4">
        <h1 className={`text-5xl md:text-6xl font-display font-black uppercase tracking-wider mb-2 ${accentText} ${neonEnabled ? (theme === THEMES.BLUE ? 'text-glow-blue' : 'text-glow-green') : ''}`}>
          CAOTRANG AI STUDIO
        </h1>
        <p className="text-gray-400 text-lg italic font-light">
          "Hãy sáng tạo theo cách riêng của bạn"
        </p>

        {/* Settings Toggle */}
        <div className="absolute top-4 right-4 flex gap-2">
           <button 
             onClick={() => setNeonEnabled(!neonEnabled)}
             className="p-2 rounded-full glass hover:bg-white/10 transition"
             title="Bật/Tắt hiệu ứng Neon"
           >
             <Zap className={`w-5 h-5 ${neonEnabled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`} />
           </button>
           <button 
             onClick={toggleTheme}
             className="p-2 rounded-full glass hover:bg-white/10 transition"
             title="Đổi màu giao diện"
           >
             <Settings className="w-5 h-5 text-gray-300" />
           </button>
        </div>
      </header>

      {/* ACTION BAR */}
      <div className="relative z-10 container mx-auto px-4 mb-10 flex justify-center gap-4 flex-wrap">
        <button className="glass px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-white/5 transition border-gray-700 text-gray-300">
          <Upload className="w-4 h-4" /> Tải lên JSON
        </button>
        <button className="glass px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-white/5 transition border-gray-700 text-gray-300">
          <Palette className="w-4 h-4" /> Canvas
        </button>
        <button className="glass px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-white/5 transition border-gray-700 text-gray-300">
          <Settings className="w-4 h-4" /> Image Editor
        </button>
      </div>

      {/* MAIN GRID */}
      <main className="relative z-10 container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {FEATURES.map((feature) => (
            <div 
              key={feature.id}
              onClick={() => handleFeatureClick(feature)}
              className={`
                group cursor-pointer glass p-6 rounded-2xl flex flex-col items-center justify-center gap-4 text-center
                transition-all duration-300 hover:-translate-y-1 hover:bg-gray-800/50
                border border-transparent hover:${accentBorder}
                ${selectedFeature?.id === feature.id ? `${accentBorder} bg-gray-800/80` : ''}
              `}
            >
              <div className={`p-4 rounded-xl bg-gray-900 group-hover:bg-gray-800 transition ${accentText}`}>
                <feature.icon className="w-8 h-8" />
              </div>
              <h3 className="font-semibold text-gray-200 group-hover:text-white">{feature.name}</h3>
            </div>
          ))}
        </div>
      </main>

      {/* HISTORY BAR (Sticky Bottom) */}
      {history.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 glass border-t border-gray-800 p-4">
          <div className="container mx-auto flex items-center gap-4 overflow-x-auto pb-2">
            <span className="text-xs text-gray-500 font-bold uppercase whitespace-nowrap">Gần đây</span>
            {history.map((item) => (
               <div key={item.id} className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-700 cursor-pointer group">
                  <img src={item.url} alt="History" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Download className="w-4 h-4 text-white" />
                  </div>
               </div>
            ))}
          </div>
        </div>
      )}

      {/* FEATURE MODAL/PANEL */}
      {selectedFeature && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`relative w-full max-w-4xl bg-gray-900 rounded-2xl border ${accentBorder} ${glowClass} flex flex-col md:flex-row overflow-hidden max-h-[90vh]`}>
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedFeature(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-300 z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Left Panel: Inputs */}
            <div className="w-full md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r border-gray-800 overflow-y-auto">
              <div className="flex items-center gap-3 mb-2">
                <selectedFeature.icon className={`w-6 h-6 ${accentText}`} />
                <h2 className="text-2xl font-display font-bold text-white">{selectedFeature.name}</h2>
              </div>
              <p className="text-gray-400 text-sm mb-6">{selectedFeature.description}</p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload Input (if needed) */}
                {(selectedFeature.type === 'image-to-image' || selectedFeature.type === 'analysis') && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Ảnh đầu vào</label>
                    <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-gray-500 transition cursor-pointer relative bg-gray-950/50">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required
                      />
                      {selectedImage ? (
                         <div className="text-center">
                           <p className="text-white font-medium">{selectedImage.name}</p>
                           <p className="text-xs">{(selectedImage.size / 1024).toFixed(1)} KB</p>
                         </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mb-2" />
                          <p className="text-xs">Kéo thả hoặc bấm để chọn ảnh</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Text Prompt Input */}
                {selectedFeature.type !== 'analysis' && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-300">Mô tả (Prompt)</label>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Mô tả chi tiết những gì bạn muốn AI thực hiện..."
                      className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 h-32 resize-none"
                      required={selectedFeature.type === 'text-to-image'}
                    />
                  </div>
                )}

                {/* Preset Prompts for Library */}
                {selectedFeature.id === 'prompt-lib' && (
                  <div className="grid gap-2">
                     <div className="p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:bg-gray-700" onClick={() => setPrompt("Cyberpunk city street at night, neon lights, rain, highly detailed")}>
                        <p className="text-xs text-gray-300 truncate">Cyberpunk city street...</p>
                     </div>
                     <div className="p-3 bg-gray-800 rounded border border-gray-700 cursor-pointer hover:bg-gray-700" onClick={() => setPrompt("Portrait of a futuristic warrior, intricate armor, 8k resolution")}>
                        <p className="text-xs text-gray-300 truncate">Futuristic warrior...</p>
                     </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 rounded-lg font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all
                    ${loading ? 'bg-gray-700 cursor-not-allowed text-gray-400' : `${accentBg} text-black hover:opacity-90 hover:shadow-lg`}
                  `}
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Đang xử lý...</>
                  ) : (
                    <><Sparkles className="w-5 h-5" /> {selectedFeature.type === 'analysis' ? 'Phân Tích' : 'Tạo Ngay'}</>
                  )}
                </button>
                
                {error && (
                  <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm text-center">
                    {error}
                  </div>
                )}
              </form>
            </div>

            {/* Right Panel: Result */}
            <div className="w-full md:w-1/2 p-6 md:p-8 bg-black/50 flex flex-col items-center justify-center min-h-[300px]">
              {result ? (
                <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in duration-500">
                  {selectedFeature.type === 'analysis' ? (
                     <div className="bg-gray-800 p-6 rounded-lg w-full h-full overflow-auto border border-gray-700">
                        <h4 className="text-lg font-bold mb-2 text-white">Kết quả phân tích:</h4>
                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{result}</p>
                     </div>
                  ) : (
                    <>
                      <div className="relative group w-full h-full rounded-lg overflow-hidden border border-gray-800">
                         <img src={result} alt="Result" className="w-full h-full object-contain" />
                      </div>
                      <a 
                        href={result} 
                        download={`caotrang-ai-${Date.now()}.png`}
                        className={`mt-4 px-6 py-2 rounded-full border ${accentBorder} ${accentText} hover:bg-gray-800 transition flex items-center gap-2`}
                      >
                        <Download className="w-4 h-4" /> Tải ảnh về
                      </a>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-600">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Kết quả sẽ hiển thị tại đây</p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
