import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Filter, 
  Package,
  Calendar,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/contexts/AuthContext';
import { useBatches } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import type { BatchStatus } from '@/types';

const statusFilters: { value: BatchStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'inspecting', label: 'Inspecting' },
  { value: 'approved', label: 'Approved' },
  { value: 'certified', label: 'Certified' },
  { value: 'rejected', label: 'Rejected' },
];

export default function BatchList() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'all'>('all');
  
  const { data, isLoading } = useBatches({
    farmerId: user?.role === 'farmer' ? user.id : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const batches = data?.data || [];
  const filteredBatches = batches.filter(batch =>
    batch.productName.toLowerCase().includes(search.toLowerCase()) ||
    batch.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Batches</h1>
            <p className="text-muted-foreground">
              {user?.role === 'farmer' ? 'Manage your batch submissions' : 'View and manage all batches'}
            </p>
          </div>
          {user?.role === 'farmer' && (
            <Button variant="gradient" asChild>
              <Link to="/batches/new">
                <Plus className="h-4 w-4" />
                New Batch
              </Link>
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search batches..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={statusFilter === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(filter.value)}
                className="shrink-0"
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Batch List */}
        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBatches.length > 0 ? (
          <div className="grid gap-4">
            {filteredBatches.map((batch, index) => (
              <motion.div
                key={batch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/batches/${batch.id}`}>
                  <Card className="hover:bg-accent/30 transition-colors cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary font-semibold text-lg">
                          {batch.productName.charAt(0)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold truncate">{batch.productName}</h3>
                            <StatusBadge status={batch.status} />
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="font-mono">{batch.id}</span>
                            <span className="flex items-center gap-1">
                              <Package className="h-3.5 w-3.5" />
                              {batch.quantity} {batch.unit}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(batch.harvestDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {batch.location.region}
                            </span>
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold mb-1">No batches found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {search ? 'Try adjusting your search terms' : 'Get started by creating your first batch'}
                </p>
                {user?.role === 'farmer' && !search && (
                  <Button variant="outline" asChild>
                    <Link to="/batches/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Batch
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </AppShell>
  );
}
