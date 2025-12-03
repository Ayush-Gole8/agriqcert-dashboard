import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Download, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface QRViewerProps {
  data: string;
  size?: number;
  title?: string;
  subtitle?: string;
  className?: string;
  showActions?: boolean;
}

export function QRViewer({
  data,
  size = 200,
  title,
  subtitle,
  className,
  showActions = true,
}: QRViewerProps) {
  const qrRef = React.useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size * 2;
      canvas.height = size * 2;
      ctx?.fillStyle && (ctx.fillStyle = '#ffffff');
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, size * 2, size * 2);
      
      const link = document.createElement('a');
      link.download = `qr-code-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    
    toast({
      title: "QR Code downloaded",
      description: "The QR code has been saved to your device.",
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      toast({
        title: "Copied to clipboard",
        description: "QR code data has been copied.",
      });
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleVerify = () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.verifyUrl) {
        window.open(parsed.verifyUrl, '_blank');
      }
    } catch {
      // Not a JSON QR code
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center p-6 rounded-2xl border border-border bg-card",
        className
      )}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
      )}
      {subtitle && (
        <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      )}

      <div 
        ref={qrRef}
        className="p-4 rounded-xl bg-white"
      >
        <QRCodeSVG
          value={data}
          size={size}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#0f1720"
        />
      </div>

      {showActions && (
        <div className="flex items-center gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-1.5" />
            Download
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4 mr-1.5" />
            Copy
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleVerify}
          >
            <ExternalLink className="h-4 w-4 mr-1.5" />
            Verify
          </Button>
        </div>
      )}
    </motion.div>
  );
}
