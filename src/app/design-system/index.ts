// ─── Design System Barrel Export ─────────────────────────────
// Tokens + custom loading/status components
export * from './tokens';
export * from './components';

// ─── Core UI Primitives (shadcn/ui) ─────────────────────────
export { Button, buttonVariants } from '../components/ui/button';
export { Input } from '../components/ui/input';
export { Label } from '../components/ui/label';
export { Switch } from '../components/ui/switch';
export { Checkbox } from '../components/ui/checkbox';
export { Separator } from '../components/ui/separator';
export { Badge, badgeVariants } from '../components/ui/badge';
export { Progress } from '../components/ui/progress';
export { Slider } from '../components/ui/slider';
export { Textarea } from '../components/ui/textarea';
export { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
export { ScrollArea, ScrollBar } from '../components/ui/scroll-area';

// Layout & overlay
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
export { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../components/ui/sheet';
export { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../components/ui/accordion';
export { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

// Menus & commands
export { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
export { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '../components/ui/context-menu';

// Data display
export { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
export { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
export { HoverCard, HoverCardContent, HoverCardTrigger } from '../components/ui/hover-card';

// Layout
export { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../components/ui/resizable';

// Utils
export { cn } from '../components/ui/utils';
