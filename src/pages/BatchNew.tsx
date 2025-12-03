import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Batch } from '@/types';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Send,
  Package,
  MapPin,
  Paperclip,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileUploader } from '@/components/FileUploader';
import { AppShell } from '@/components/layout/AppShell';
import { useCreateBatch, useSubmitBatch, useSaveDraft } from '@/hooks/useApi';
import { productTypes, units } from '@/api/mockData';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const batchSchema = z.object({
  productType: z.string().min(1, 'Please select a product type'),
  productName: z.string().min(2, 'Product name must be at least 2 characters').max(100),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unit: z.string().min(1, 'Please select a unit'),
  harvestDate: z.string().min(1, 'Please select a harvest date'),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string().min(5, 'Please enter a valid address'),
    region: z.string().min(2, 'Please enter a region'),
  }),
});

type BatchFormData = z.infer<typeof batchSchema>;

const steps = [
  { id: 1, title: 'Product Details', icon: Package },
  { id: 2, title: 'Location & Date', icon: MapPin },
  { id: 3, title: 'Attachments', icon: Paperclip },
  { id: 4, title: 'Review', icon: CheckCircle },
];

export default function BatchNew() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [draftId] = useState(() => `draft-${Date.now()}`);

  const createBatch = useCreateBatch();
  const submitBatch = useSubmitBatch();
  const saveDraft = useSaveDraft();

  const form = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      productType: '',
      productName: '',
      quantity: 0,
      unit: 'kg',
      harvestDate: '',
      location: {
        latitude: 14.5995,
        longitude: 120.9842,
        address: '',
        region: '',
      },
    },
  });

  // Auto-save draft
  const autoSave = useCallback(() => {
    const data = form.getValues();
    saveDraft.mutate({
      id: draftId,
      data: data as unknown as Partial<Batch>,
      step: currentStep,
      lastSavedAt: new Date().toISOString(),
    });
  }, [draftId, currentStep, form, saveDraft]);

  useEffect(() => {
    const interval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [autoSave]);

  // Load draft on mount
  useEffect(() => {
    const stored = localStorage.getItem(`draft_${draftId}`);
    if (stored) {
      const draft = JSON.parse(stored);
      if (draft.data) {
        form.reset(draft.data);
        setCurrentStep(draft.step || 1);
      }
    }
  }, [draftId, form]);

  const handleSaveDraft = () => {
    autoSave();
    toast({
      title: 'Draft saved',
      description: 'Your batch has been saved as a draft.',
    });
  };

  const handleNext = async () => {
    let isValid = true;
    
    if (currentStep === 1) {
      isValid = await form.trigger(['productType', 'productName', 'quantity', 'unit']);
    } else if (currentStep === 2) {
      isValid = await form.trigger(['harvestDate', 'location']);
    }

    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    if (!isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = form.getValues();
      const result = await createBatch.mutateAsync(data as unknown as Partial<Batch>);
      await submitBatch.mutateAsync(result.data.id);
      
      // Clean up draft
      localStorage.removeItem(`draft_${draftId}`);
      
      toast({
        title: 'Batch Submitted',
        description: 'Your batch has been submitted for inspection.',
      });
      navigate(`/batches/${result.data.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit batch. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const values = form.watch();

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">New Batch Submission</h1>
            <p className="text-muted-foreground">Create a new batch for quality certification</p>
          </div>
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  currentStep >= step.id ? "text-primary" : "text-muted-foreground"
                )}
                onClick={() => currentStep > step.id && setCurrentStep(step.id)}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  currentStep >= step.id 
                    ? "border-primary bg-primary text-primary-foreground" 
                    : "border-border"
                )}>
                  {currentStep > step.id ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <step.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2",
                  currentStep > step.id ? "bg-primary" : "bg-border"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Form Card */}
        <Card variant="elevated">
          <CardContent className="p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Product Details */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-lg font-semibold mb-4">Product Details</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Product Type</label>
                        <select
                          {...form.register('productType')}
                          className="input-base"
                        >
                          <option value="">Select type...</option>
                          {productTypes.map(type => (
                            <option key={type.value} value={type.value}>{type.label}</option>
                          ))}
                        </select>
                        {form.formState.errors.productType && (
                          <p className="text-sm text-destructive">{form.formState.errors.productType.message}</p>
                        )}
                      </div>

                      <Input
                        label="Product Name"
                        placeholder="e.g., Organic Tomatoes"
                        error={form.formState.errors.productName?.message}
                        {...form.register('productName')}
                      />

                      <Controller
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <Input
                            label="Quantity"
                            type="number"
                            placeholder="0"
                            error={form.formState.errors.quantity?.message}
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        )}
                      />

                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Unit</label>
                        <select
                          {...form.register('unit')}
                          className="input-base"
                        >
                          {units.map(unit => (
                            <option key={unit.value} value={unit.value}>{unit.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Location & Date */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h2 className="text-lg font-semibold mb-4">Location & Harvest Date</h2>
                  <div className="grid gap-4">
                    <Input
                      label="Harvest Date"
                      type="date"
                      error={form.formState.errors.harvestDate?.message}
                      {...form.register('harvestDate')}
                    />

                    <Input
                      label="Farm Address"
                      placeholder="123 Farm Road, Municipality"
                      error={form.formState.errors.location?.address?.message}
                      {...form.register('location.address')}
                    />

                    <Input
                      label="Region"
                      placeholder="e.g., Calabarzon"
                      error={form.formState.errors.location?.region?.message}
                      {...form.register('location.region')}
                    />

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <p className="text-sm text-muted-foreground mb-2">GPS Coordinates (auto-detected)</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-xs text-muted-foreground">Latitude</span>
                          <p className="font-mono text-sm">{values.location.latitude.toFixed(4)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Longitude</span>
                          <p className="font-mono text-sm">{values.location.longitude.toFixed(4)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Attachments */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h2 className="text-lg font-semibold mb-2">Attachments</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload photos of your harvest, soil tests, or other supporting documents.
                    </p>
                  </div>

                  <FileUploader
                    accept="image/*,application/pdf"
                    multiple
                    maxFiles={5}
                    maxSize={10 * 1024 * 1024}
                    onFilesChange={setAttachments}
                  />
                </motion.div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold">Review & Submit</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <h3 className="font-medium mb-3">Product Information</h3>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-muted-foreground">Product Type</dt>
                        <dd className="capitalize">{values.productType}</dd>
                        <dt className="text-muted-foreground">Product Name</dt>
                        <dd>{values.productName}</dd>
                        <dt className="text-muted-foreground">Quantity</dt>
                        <dd>{values.quantity} {values.unit}</dd>
                      </dl>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/50 border border-border">
                      <h3 className="font-medium mb-3">Location & Date</h3>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-muted-foreground">Harvest Date</dt>
                        <dd>{values.harvestDate ? new Date(values.harvestDate).toLocaleDateString() : '-'}</dd>
                        <dt className="text-muted-foreground">Address</dt>
                        <dd>{values.location.address || '-'}</dd>
                        <dt className="text-muted-foreground">Region</dt>
                        <dd>{values.location.region || '-'}</dd>
                      </dl>
                    </div>

                    {attachments.length > 0 && (
                      <div className="p-4 rounded-xl bg-muted/50 border border-border">
                        <h3 className="font-medium mb-3">Attachments</h3>
                        <p className="text-sm text-muted-foreground">{attachments.length} file(s) attached</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {currentStep < 4 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button 
                variant="gradient"
                onClick={handleSubmit}
                disabled={createBatch.isPending || submitBatch.isPending}
              >
                {(createBatch.isPending || submitBatch.isPending) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Batch
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </AppShell>
  );
}
