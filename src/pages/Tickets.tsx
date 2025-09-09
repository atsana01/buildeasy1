import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import TicketDetailsModal from '@/components/TicketDetailsModal';
import SendMessageModal from '@/components/SendMessageModal';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Star,
  MapPin,
  DollarSign,
  Calendar,
  RefreshCw,
  Eye,
  MessageSquare,
  Trash2,
  ExternalLink,
  User,
  Settings,
  Plus
} from 'lucide-react';

interface Ticket {
  id: string;
  groupName: string;
  vendor: {
    id: string;
    name: string;
    rating: number;
    reviews: number;
    location: string;
    specialty: string;
    avgPrice: string;
    deliveryTime: string;
    verified: boolean;
  };
  projectDescription: string;
  formData?: any;
  status: 'pending' | 'quoted' | 'accepted' | 'declined' | 'completed';
  createdAt: Date;
  quotedAmount?: string;
  notes?: string;
}

const Tickets = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchTickets();
    }
  }, [user]);

  const fetchTickets = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch quote requests first (excluding soft-deleted ones)
      const { data: quoteRequests, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('client_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Batch fetch project and vendor data
      const projectIds = [...new Set(quoteRequests?.map(qr => qr.project_id) || [])];
      const vendorIds = [...new Set(quoteRequests?.map(qr => qr.vendor_id) || [])];

      const [projectsResult, vendorProfilesResult] = await Promise.all([
        supabase.from('projects').select('id, title, description, service_groups').in('id', projectIds),
        supabase.from('vendor_profiles').select('user_id, business_name, location, rating, total_reviews, verification_status, specialty').in('user_id', vendorIds)
      ]);

      // Create lookup maps
      const projectsMap = new Map(projectsResult.data?.map(p => [p.id, p]) || []);
      const vendorsMap = new Map(vendorProfilesResult.data?.map(v => [v.user_id, v]) || []);

      // Transform the data
      const transformedTickets: Ticket[] = (quoteRequests || []).map(qr => {
        const project = projectsMap.get(qr.project_id);
        const vendorProfile = vendorsMap.get(qr.vendor_id);
        
        return {
          id: qr.id,
          groupName: project?.service_groups?.[0] || 'General',
          vendor: {
            id: qr.vendor_id,
            name: vendorProfile?.business_name || 'Unknown Vendor',
            rating: vendorProfile?.rating || 0,
            reviews: vendorProfile?.total_reviews || 0,
            location: vendorProfile?.location || 'Unknown',
            specialty: vendorProfile?.specialty?.[0] || 'General',
            avgPrice: qr.quoted_amount ? `$${qr.quoted_amount}` : 'Quote Pending',
            deliveryTime: qr.estimated_timeline || 'TBD',
            verified: vendorProfile?.verification_status === 'verified'
          },
          projectDescription: project?.description || project?.title || 'No description',
          status: qr.status as 'pending' | 'quoted' | 'accepted' | 'declined' | 'completed',
          createdAt: new Date(qr.created_at),
          quotedAmount: qr.quoted_amount ? `$${qr.quoted_amount}` : undefined,
          notes: qr.vendor_notes || undefined
        };
      });

      setTickets(transformedTickets);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load tickets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.groupName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'secondary' as const, text: 'Pending Quote', icon: Clock },
      quoted: { variant: 'default' as const, text: 'Quote Received', icon: CheckCircle2 },
      accepted: { variant: 'default' as const, text: 'Accepted', icon: CheckCircle2 },
      declined: { variant: 'destructive' as const, text: 'Declined', icon: AlertCircle },
      completed: { variant: 'default' as const, text: 'Completed', icon: CheckCircle2 }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const handleBackToProject = () => {
    navigate('/');
  };

  const handleRefreshVendors = () => {
    toast({
      title: "Vendors Refreshed",
      description: "Vendor data updated! New vendors may be available for your project.",
    });
  };

  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailsModalOpen(true);
  };

  const handleSendMessage = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsMessageModalOpen(true);
  };

  const handleDeleteRequest = async (ticketId: string) => {
    setTicketToDelete(ticketId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteRequest = async () => {
    if (!ticketToDelete) return;
    
    try {
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabase
        .from('quote_requests')
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq('id', ticketToDelete)
        .eq('client_id', user?.id); // Extra security check

      if (error) throw error;

      setTickets(prevTickets => prevTickets.filter(t => t.id !== ticketToDelete));
      toast({
        title: "Request Deleted",
        description: "The quote request has been successfully deleted.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setTicketToDelete(null);
    }
  };

  const handlePortfolioClick = (ticket: Ticket) => {
    // In the future, this will redirect to the vendor's portfolio page
    toast({
      title: "Portfolio Coming Soon",
      description: `${ticket.vendor.name}'s portfolio will be available once vendors provide their website links.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Client Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Track your quote requests and vendor responses
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/profile')} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Profile Settings
            </Button>
            <Button onClick={handleBackToProject} className="bg-gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by vendor or service type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-primary">{tickets.length}</div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {tickets.filter(t => t.status === 'pending').length}
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-accent">
                {tickets.filter(t => t.status === 'quoted').length}
              </div>
              <p className="text-sm text-muted-foreground">Quoted</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <div className="text-2xl font-bold text-accent">
                {tickets.filter(t => t.status === 'accepted').length}
              </div>
              <p className="text-sm text-muted-foreground">Accepted</p>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List */}
        {loading ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading your tickets...</p>
            </CardContent>
          </Card>
        ) : filteredTickets.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start by creating a new project to generate quote tickets'
                }
              </p>
              <Button onClick={handleBackToProject} className="bg-gradient-primary">
                Create New Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="shadow-card hover:shadow-elegant transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Vendor Profile Picture */}
                      <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {ticket.vendor.name.charAt(0)}
                      </div>
                      
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-lg truncate">{ticket.vendor.name}</CardTitle>
                          {ticket.vendor.verified && (
                            <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                          )}
                          {getStatusBadge(ticket.status)}
                        </div>
                        <Badge variant="outline" className="w-fit">
                          {ticket.groupName}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-muted-foreground space-y-2 shrink-0 ml-2">
                      <div className="flex items-center gap-1 justify-end">
                        <Calendar className="w-3 h-3" />
                        <span className="whitespace-nowrap">{ticket.createdAt.toLocaleDateString()}</span>
                      </div>
                      {/* Portfolio Button */}
                      <Button
                        size="sm"
                        onClick={() => handlePortfolioClick(ticket)}
                        className="bg-purple text-purple-foreground hover:bg-purple/90 text-xs h-6 px-2"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        PORTFOLIO
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Vendor Details */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-primary text-primary" />
                          <span className="font-medium">{ticket.vendor.rating.toFixed(1)}</span>
                          <span className="text-muted-foreground">({ticket.vendor.reviews})</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="truncate max-w-[120px]">{ticket.vendor.location}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-accent" />
                          <span>{ticket.vendor.avgPrice}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{ticket.vendor.deliveryTime}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        <User className="w-3 h-3 inline mr-1" />
                        {ticket.vendor.specialty}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Project Description */}
                    <div>
                      <h4 className="font-medium mb-2">Project Description</h4>
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded line-clamp-3 leading-relaxed">
                        {ticket.projectDescription}
                      </p>
                    </div>
                    
                    {/* Quote Information */}
                    {ticket.status === 'quoted' && ticket.quotedAmount && (
                      <div className="bg-accent/10 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-accent">Quote Received</h4>
                            <p className="text-2xl font-bold text-accent">{ticket.quotedAmount}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-gradient-primary">Accept</Button>
                            <Button size="sm" variant="outline">Negotiate</Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(ticket)}
                        className="flex items-center gap-2 hover:bg-primary/10 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View Details</span>
                        <span className="sm:hidden">Details</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSendMessage(ticket)}
                        className="flex items-center gap-2 hover:bg-accent/10 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">Send Message</span>
                        <span className="sm:hidden">Message</span>
                      </Button>
                      {(ticket.status === 'pending' || ticket.status === 'quoted') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteRequest(ticket.id)}
                          className="flex items-center gap-2 hover:bg-destructive/10 text-destructive hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete Request</span>
                          <span className="sm:hidden">Delete</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TicketDetailsModal
        ticket={selectedTicket}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
      
      <SendMessageModal
        ticket={selectedTicket}
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
      />
      
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteRequest}
        title="Delete Quote Request"
        description="Are you sure you want to delete this quote request? This action cannot be undone and the vendor will no longer be able to respond to your request."
      />
    </div>
  );
};

export default Tickets;