import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { useGetEventByRegistrationQuery, useCheckInMutation } from '@/store/api/eventsApi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, QrCode, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SCANNER_DIV_ID = 'event-checkin-qr-reader';

export function EventCheckIn() {
  const { id } = useParams<{ id: string }>();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);

  const { data: registration, isLoading: loadingReg } = useGetEventByRegistrationQuery(scanResult || manualId, {
    skip: (!scanResult && !manualId) || !id,
  });
  const [checkIn, { isLoading: checkingIn }] = useCheckInMutation();

  useEffect(() => {
    if (!id || !scanResult) return;
    const regId = scanResult;
    if (handledRef.current) return;
    handledRef.current = true;
    checkIn({ eventId: id, registrationId: regId })
      .unwrap()
      .then(() => {
        toast.success('Checked in successfully');
        setScanResult(null);
        handledRef.current = false;
      })
      .catch(() => {
        toast.error('Check-in failed');
        handledRef.current = false;
      });
  }, [id, scanResult, checkIn]);

  useEffect(() => {
    if (!id) return;
    const el = document.getElementById(SCANNER_DIV_ID);
    if (!el) return;
    const scanner = new Html5Qrcode(SCANNER_DIV_ID);
    scannerRef.current = scanner;
    scanner
      .start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 250, height: 250 } }, (decodedText) => {
        if (handledRef.current) return;
        setScanResult(decodedText);
      }, () => {})
      .then(() => {})
      .catch((e) => {
        console.error(e);
        toast.error('Could not start camera');
      });
    return () => {
      if (scannerRef.current?.isScanning) scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [id]);

  const onManualCheckIn = () => {
    if (!manualId.trim()) return;
    setScanResult(manualId.trim());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/dashboard/events/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Event check-in</h1>
          <p className="text-muted-foreground">Scan participant QR or enter registration ID</p>
        </div>
      </div>

      <Card className="overflow-hidden border-border/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <QrCode className="h-5 w-5" />
            Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div id={SCANNER_DIV_ID} className="min-h-[280px] w-full max-w-md mx-auto bg-black/5" />
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Manual check-in</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <input
            type="text"
            placeholder="Registration ID"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
          />
          <Button onClick={onManualCheckIn} disabled={!manualId.trim() || checkingIn}>
            <CheckCircle className="h-4 w-4 mr-1" /> Check in
          </Button>
        </CardContent>
      </Card>

      {loadingReg && scanResult && (
        <p className="text-sm text-muted-foreground">Verifying registration…</p>
      )}
      {registration && (
        <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardContent className="pt-6">
            <p className="font-medium">{registration.user?.name} ({registration.user?.fastId})</p>
            <p className="text-sm text-muted-foreground">Registered for {registration.event?.title}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
