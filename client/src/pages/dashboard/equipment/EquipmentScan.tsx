import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import toast from 'react-hot-toast';

const SCANNER_DIV_ID = 'equipment-qr-reader';

export function EquipmentScan() {
  const navigate = useNavigate();
  const [scannerReady, setScannerReady] = useState(false);
  const handledRef = useRef(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      const element = document.getElementById(SCANNER_DIV_ID);
      if (!element) return;
      try {
        const scanner = new Html5Qrcode(SCANNER_DIV_ID);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (handledRef.current) return;
            handledRef.current = true;
            toast.success('QR code scanned');
            scanner.stop().catch(() => {});
            scannerRef.current = null;
            navigate(`/dashboard/equipment/qr/${encodeURIComponent(decodedText)}`, { replace: true });
          },
          () => {}
        );
        setScannerReady(true);
      } catch (e) {
        console.error('Scanner start failed', e);
        toast.error('Could not start camera. Check permissions.');
      }
    };
    startScanner();
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [navigate]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/equipment">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scan equipment QR</h1>
          <p className="text-muted-foreground">Point your camera at the equipment QR code</p>
        </div>
      </div>

      <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5" />
            Camera
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Allow camera access when prompted. Position the QR code within the frame.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <div
            id={SCANNER_DIV_ID}
            className="min-h-[300px] w-full max-w-md mx-auto bg-black/5"
          />
          {!scannerReady && (
            <div className="flex min-h-[300px] items-center justify-center p-4 text-muted-foreground">
              Starting camera…
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Or <Link to="/dashboard/equipment" className="text-fast-primary underline">browse the catalog</Link> to check out by item.
      </p>
    </div>
  );
}
