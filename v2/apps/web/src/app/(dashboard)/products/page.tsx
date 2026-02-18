'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Star,
  Eye,
  Edit,
  Trash2,
  Package,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// ─── Mock data ──────────────────────────────────────────────
const PRODUCTS = Array.from({ length: 32 }, (_, i) => ({
  id: `p${i + 1}`,
  name: [
    'MacBook Pro 16"', 'iPhone 15 Pro', 'AirPods Max', 'iPad Air M2',
    'Apple Watch Ultra', 'Magic Keyboard', 'Studio Display', 'Mac Mini M2',
  ][i % 8]!,
  category: (['Electronics', 'Accessories', 'Displays', 'Computers'] as const)[i % 4],
  price: [2499, 1199, 549, 799, 799, 299, 1599, 599][i % 8]!,
  stock: Math.floor(Math.random() * 200),
  status: (['in-stock', 'in-stock', 'low-stock', 'out-of-stock'] as const)[i % 4],
  rating: (3.5 + (i % 3) * 0.5),
  image: null,
}));

const PAGE_SIZE = 8;

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  'in-stock': { label: 'In Stock', variant: 'success' },
  'low-stock': { label: 'Low Stock', variant: 'warning' },
  'out-of-stock': { label: 'Out of Stock', variant: 'destructive' },
};

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const categories = [...new Set(PRODUCTS.map((p) => p.category))];

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return PRODUCTS
      .filter((p) => p.name.toLowerCase().includes(q))
      .filter((p) => !categoryFilter || p.category === categoryFilter);
  }, [search, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(0);
                  }}
                />
              </div>
            </div>
            {/* Category filters */}
            <div className="flex flex-wrap gap-1.5">
              <Button
                variant={categoryFilter === null ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => { setCategoryFilter(null); setPage(0); }}
              >
                All
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => { setCategoryFilter(cat ?? null); setPage(0); }}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/30">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Product</th>
                  <th className="px-6 py-3 text-left font-medium">Category</th>
                  <th className="px-6 py-3 text-left font-medium">Price</th>
                  <th className="px-6 py-3 text-left font-medium">Stock</th>
                  <th className="px-6 py-3 text-left font-medium">Status</th>
                  <th className="px-6 py-3 text-left font-medium">Rating</th>
                  <th className="px-6 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paged.map((product) => {
                  const status = product.status ? statusConfig[product.status] : undefined;
                  return (
                    <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{product.category}</td>
                      <td className="px-6 py-4 font-medium">${product.price}</td>
                      <td className="px-6 py-4 text-muted-foreground">{product.stock}</td>
                      <td className="px-6 py-4">
                        <Badge variant={status?.variant ?? 'secondary'}>{status?.label ?? product.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                          <span className="text-sm">{product.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                            <DropdownMenuItem><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 pt-4">
            <p className="text-sm text-muted-foreground">
              {filtered.length} products · Page {page + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
