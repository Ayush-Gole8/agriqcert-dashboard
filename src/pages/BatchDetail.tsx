import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  User,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  Clock,
  Award,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { QRViewer } from '@/components/QRViewer';
import { AppShell } from '@/components/layout/AppShell';
import { useBatch, useInspections, useCertificate } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

export default function BatchDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: batchData, isLoading } = useBatch(id || '');
  const { data: inspectionsData } = useInspections(id);
  
  const batch = batchData?.data;
  const inspections = inspectionsData?.data || [];
  const inspection = inspections[0];

  // For demo, we'll use the first certificate if batch is certified
  const { data: certData } = useCertificate(batch?.status === 'certified' ? 'CERT-2024-001' : '');
  const certificate = certData?.data;

  if (isLoading) {
    return (
      <AppShell>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </AppShell>
    );
  }

  if (!batch) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Batch not found</h2>
          <p className="text-muted-foreground mb-4">The batch you're looking for doesn't exist.</p>
          <Button variant="outline" asChild>
            <Link to="/batches">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Batches
            </Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const timeline = [
    { event: 'Batch Created', date: batch.createdAt, status: 'completed' as const },
    { event: 'Submitted for Inspection', date: batch.submittedAt, status: batch.submittedAt ? 'completed' as const : 'pending' as const },
    { event: 'Inspection', date: inspection?.completedAt, status: inspection?.status === 'completed' ? 'completed' as const : inspection ? 'current' as const : 'pending' as const },
    { event: 'Certification', date: batch.certifiedAt, status: batch.certifiedAt ? 'completed' as const : 'pending' as const },
  ];

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/batches">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{batch.productName}</h1>
                <StatusBadge status={batch.status} />
              </div>
              <p className="text-muted-foreground font-mono">{batch.id}</p>
            </div>
          </div>
          
          {batch.status === 'certified' && certificate && (
            <Button variant="gradient" asChild>
              <Link to={`/certificates/${certificate.id}`}>
                <Award className="h-4 w-4 mr-2" />
                View Certificate
              </Link>
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm text-muted-foreground">Product Type</dt>
                    <dd className="font-medium capitalize">{batch.productType}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Quantity</dt>
                    <dd className="font-medium">{batch.quantity} {batch.unit}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Harvest Date</dt>
                    <dd className="font-medium">{new Date(batch.harvestDate).toLocaleDateString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Farmer</dt>
                    <dd className="font-medium">{batch.farmerName}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="font-medium">{batch.location.address}</p>
                  <p className="text-sm text-muted-foreground">{batch.location.region}</p>
                  <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
                    <span>Lat: {batch.location.latitude.toFixed(4)}</span>
                    <span>Long: {batch.location.longitude.toFixed(4)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            {batch.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Attachments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {batch.attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="group relative aspect-square rounded-xl border border-border overflow-hidden bg-muted"
                      >
                        {attachment.type === 'image' ? (
                          <img
                            src={attachment.url}
                            alt={attachment.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full p-4">
                            <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-center truncate w-full">{attachment.name}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="secondary" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inspection Summary */}
            {inspection && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Inspection Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{inspection.inspectorName}</p>
                        <p className="text-sm text-muted-foreground">
                          {inspection.completedAt 
                            ? `Completed on ${new Date(inspection.completedAt).toLocaleDateString()}`
                            : 'In progress'}
                        </p>
                      </div>
                      <Badge variant={inspection.overallResult === 'pass' ? 'success' : inspection.overallResult === 'fail' ? 'rejected' : 'pending'}>
                        {inspection.overallResult === 'pass' ? 'Passed' : inspection.overallResult === 'fail' ? 'Failed' : 'Pending'}
                      </Badge>
                    </div>

                    {inspection.readings.length > 0 && (
                      <div className="space-y-2">
                        {inspection.readings.map((reading, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                            <span className="text-sm">{reading.parameter}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono">{reading.value} {reading.unit}</span>
                              {reading.passed ? (
                                <CheckCircle className="h-4 w-4 text-success" />
                              ) : (
                                <Clock className="h-4 w-4 text-warning" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lifecycle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />
                  <ul className="space-y-4">
                    {timeline.map((event, index) => (
                      <li key={index} className="relative flex gap-3 pl-9">
                        <div className={cn(
                          "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2",
                          event.status === 'completed' ? "border-success bg-success/10" :
                          event.status === 'current' ? "border-primary bg-primary/10" :
                          "border-border bg-muted"
                        )}>
                          {event.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : event.status === 'current' ? (
                            <Clock className="h-4 w-4 text-primary animate-pulse" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{event.event}</p>
                          {event.date && (
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* QR Code */}
            {certificate && (
              <QRViewer
                data={certificate.qrCodeData}
                title="Certificate QR"
                subtitle="Scan to verify authenticity"
                size={180}
              />
            )}
          </div>
        </div>
      </motion.div>
    </AppShell>
  );
}
