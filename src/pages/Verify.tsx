import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, QrCode, FileText, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VerificationResult as VerificationResultComponent } from '@/components/VerificationResult';
import { AppShell } from '@/components/layout/AppShell';
import { useVerification, useVerifyQR } from '@/hooks/useApi';
import { toast } from '@/hooks/use-toast';
import type { VerificationResult } from '@/types';

export default function Verify() {
  const [certId, setCertId] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const [qrResult, setQrResult] = useState<VerificationResult | null>(null);
  
  const { data: verificationData, isLoading } = useVerification(searchedId);
  const verifyQR = useVerifyQR();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      setSearchedId(certId.trim());
      setQrResult(null);
    }
  };

  const handleDemoQR = async () => {
    // Simulate QR scan with demo data
    const demoQRData = JSON.stringify({
      type: 'AgriQCert',
      certId: 'CERT-2024-001',
      batchId: 'BATCH-2024-001',
      verifyUrl: 'https://agriqcert.com/verify/CERT-2024-001',
    });

    try {
      const result = await verifyQR.mutateAsync(demoQRData);
      if (result.data) {
        setQrResult(result.data);
        setSearchedId('');
      }
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: 'Unable to verify QR code.',
        variant: 'destructive',
      });
    }
  };

  const result = qrResult || verificationData?.data;

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold">Verify Certificate</h1>
          <p className="text-muted-foreground">
            Enter a certificate ID or scan a QR code to verify authenticity
          </p>
        </div>

        {/* Search Form */}
        <Card variant="elevated">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter Certificate ID (e.g., CERT-2024-001)"
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" disabled={!certId.trim() || isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleDemoQR}
                  disabled={verifyQR.isPending}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  {verifyQR.isPending ? 'Verifying...' : 'Demo QR Scan'}
                </Button>
                <Button type="button" variant="outline" className="flex-1" disabled>
                  <Camera className="h-4 w-4 mr-2" />
                  Scan QR Code
                </Button>
                <Button type="button" variant="outline" className="flex-1" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Upload QR Image
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick Demo */}
        {!result && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Verification</CardTitle>
              <CardDescription>Try these sample certificate IDs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {['CERT-2024-001'].map((id) => (
                  <Button
                    key={id}
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setCertId(id);
                      setSearchedId(id);
                    }}
                  >
                    {id}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <VerificationResultComponent result={result} />
        )}
      </motion.div>
    </AppShell>
  );
}
