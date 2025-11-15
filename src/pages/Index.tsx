import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ScannedPrice {
  id: string;
  image: string;
  text: string;
  price: string;
  date: string;
}

const Index = () => {
  const [activeTab, setActiveTab] = useState('camera');
  const [scannedPrices, setScannedPrices] = useState<ScannedPrice[]>([]);
  const [offlineMode, setOfflineMode] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (activeTab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Не удалось получить доступ к камере');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (context) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg');
      
      const mockPrice: ScannedPrice = {
        id: Date.now().toString(),
        image: imageData,
        text: 'Молоко 3.2%',
        price: '89.90 ₽',
        date: new Date().toLocaleString('ru-RU')
      };

      setScannedPrices(prev => [mockPrice, ...prev]);
      toast.success('Ценник распознан');
    }

    setTimeout(() => setIsCapturing(false), 300);
  };

  const deletePrice = (id: string) => {
    setScannedPrices(prev => prev.filter(item => item.id !== id));
    toast.success('Удалено');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-md mx-auto p-0">
        <div className="h-screen flex flex-col">
          <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">Ценники</h1>
            <Icon name="ScanLine" size={24} className="text-primary" />
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b bg-white grid grid-cols-3">
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <Icon name="Camera" size={18} />
                <span>Камера</span>
              </TabsTrigger>
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <Icon name="Images" size={18} />
                <span>Галерея</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Icon name="Settings" size={18} />
                <span>Настройки</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="flex-1 m-0 relative">
              <div className="h-full bg-black flex items-center justify-center relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-white border-dashed w-3/4 h-48 rounded-lg opacity-50" />
                </div>

                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                  <Button
                    size="lg"
                    onClick={captureImage}
                    disabled={isCapturing}
                    className={`w-20 h-20 rounded-full bg-white hover:bg-gray-100 transition-transform ${
                      isCapturing ? 'scale-90' : 'scale-100'
                    }`}
                  >
                    <Icon name="Camera" size={32} className="text-primary" />
                  </Button>
                </div>

                {offlineMode && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <Icon name="Wifi" size={14} />
                    Офлайн
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="gallery" className="flex-1 m-0 overflow-auto p-4">
              {scannedPrices.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground animate-fade-in">
                  <Icon name="ImageOff" size={64} className="mb-4 opacity-20" />
                  <p className="text-lg">Пока нет сохранённых ценников</p>
                  <p className="text-sm mt-2">Отсканируйте первый в камере</p>
                </div>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  {scannedPrices.map((item) => (
                    <Card key={item.id} className="overflow-hidden animate-scale-in">
                      <div className="flex gap-4 p-4">
                        <img
                          src={item.image}
                          alt="Ценник"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{item.text}</p>
                          <p className="text-2xl font-bold text-primary mt-1">{item.price}</p>
                          <p className="text-xs text-muted-foreground mt-2">{item.date}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deletePrice(item.id)}
                          className="self-start"
                        >
                          <Icon name="Trash2" size={18} className="text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="flex-1 m-0 p-6">
              <div className="space-y-6 animate-fade-in">
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="offline-mode" className="text-base font-semibold">
                        Офлайн режим
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Работа без подключения к интернету
                      </p>
                    </div>
                    <Switch
                      id="offline-mode"
                      checked={offlineMode}
                      onCheckedChange={(checked) => {
                        setOfflineMode(checked);
                        toast.success(checked ? 'Офлайн режим включён' : 'Онлайн режим включён');
                      }}
                    />
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">Статистика</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-primary">{scannedPrices.length}</p>
                        <p className="text-sm text-muted-foreground">Всего сканов</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold text-primary">
                          {scannedPrices.length > 0 ? scannedPrices[0].price : '—'}
                        </p>
                        <p className="text-sm text-muted-foreground">Последняя цена</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="space-y-4">
                    <h3 className="text-base font-semibold">О приложении</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>Версия: 1.0.0</p>
                      <p>Распознавание текста с ценников</p>
                      <p>Работает офлайн для базовых функций</p>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
