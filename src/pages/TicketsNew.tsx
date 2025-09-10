import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, MapPin, Clock, DollarSign, MessageSquare, Trash2, Phone, Mail, Building } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import SendMessageModal from '@/components/SendMessageModal';
import TicketDetailsModal from '@/components/TicketDetailsModal';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { ProjectTabsFixed as ProjectTabs } from '@/components/ProjectTabsFixed';

interface Ticket {
  id: string;
  vendor: {
    id: string;
    name: string;
    location: string;
    rating: number;
    reviewCount: number;
    verified: boolean;
    specialty: string[];
  };
  projectDescription: string;
  formData?: any;
  status: 'pending' | 'quoted' | 'accepted' | 'declined';
  createdAt: Date;
  quotedAmount?: number;
  vendorNotes?: string;
  estimatedTimeline?: string;
  projectTitle: string;
}

const TicketsNew = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTicketForDelete, setSelectedTicketForDelete] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const fetchTicketsForProject = async (projectId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch quote requests for specific project with proper null check for deleted_at
      const { data: quoteRequests, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('client_id', user.id)
        .eq('project_id', projectId)
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
      const transformedTickets: Ticket[] = quoteRequests?.map(qr => {
        const project = projectsMap.get(qr.project_id);
        const vendor = vendorsMap.get(qr.vendor_id);
        
        return {
          id: qr.id,
          vendor: {
            id: qr.vendor_id,
            name: vendor?.business_name || 'Unknown Vendor',
            location: vendor?.location || 'Location not specified',
            rating: vendor?.rating || 0,
            reviewCount: vendor?.total_reviews || 0,
            verified: vendor?.verification_status === 'verified',
            specialty: vendor?.specialty || []
          },
          projectDescription: project?.description || 'No description available',
          formData: project?.service_groups || [],
          status: qr.status as 'pending' | 'quoted' | 'accepted' | 'declined',
          createdAt: new Date(qr.created_at),
          quotedAmount: qr.quoted_amount,
          vendorNotes: qr.vendor_notes,
          estimatedTimeline: qr.estimated_timeline,
          projectTitle: project?.title || 'Untitled Project'
        };
      }) || [];

      setTickets(transformedTickets);
    } catch (error: any) {
      console.error('Error fetching tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeProjectId) {
      fetchTicketsForProject(activeProjectId);
    }
  }, [user, activeProjectId]);

  useEffect(() => {
    // Filter tickets based on search and status
    let filtered = tickets;
    
    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.projectDescription.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }
    
    setFilteredTickets(filtered);
  }, [tickets, searchTerm, statusFilter]);

  const handleDeleteRequest = async (ticketId: string) => {
    try {
      // First, get the quote request to find the vendor and project
      const { data: quoteRequest } = await supabase
        .from('quote_requests')
        .select('vendor_id, project_id')
        .eq('id', ticketId)
        .eq('client_id', user?.id)
        .single();

      if (error) throw error;
        // Soft delete the quote request
        const { error } = await supabase
          .from('quote_requests')
          .update({ deleted_at: new Date().toISOString() } as any)
          .eq('id', ticketId);
      }

      toast({
        title: "Success",
        description: "Quote request deleted successfully",
      });

      // Refresh the tickets list
      if (activeProjectId) {
        fetchTicketsForProject(activeProjectId);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete quote request",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'quoted': return 'default';
      case 'accepted': return 'default';
      case 'declined': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Projects & Quotes</h1>
            <p className="text-muted-foreground">Manage your projects, quotes and communications</p>
          </div>
        </div>

        <ProjectTabs 
          activeProjectId={activeProjectId}
          onProjectChange={setActiveProjectId}
        >
          {(projectId) => (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search vendors or projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border rounded-md"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="quoted">Quoted</option>
                  <option value="accepted">Accepted</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{tickets.length}</div>
                    <div className="text-sm text-muted-foreground">Total Quotes</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {tickets.filter(t => t.status === 'pending').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pending</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {tickets.filter(t => t.status === 'quoted').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Quoted</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {tickets.filter(t => t.status === 'accepted').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Accepted</div>
                  </CardContent>
                </Card>
              </div>

              {/* Tickets List */}
              {loading ? (
                <div className="text-center py-8">Loading tickets...</div>
              ) : filteredTickets.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground mb-4">
                      No tickets found for this project
                    </div>
                    <Button onClick={() => window.location.href = '/'}>
                      Add More Vendors
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredTickets.map((ticket) => (
                    <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{ticket.vendor.name}</h3>
                              <Badge variant={getStatusBadgeVariant(ticket.status)}>
                                {ticket.status}
                              </Badge>
                              {ticket.vendor.verified && (
                                <Badge variant="outline">Verified</Badge>
                              )}
                            </div>
                            
                            <p className="text-muted-foreground text-sm mb-3">
                              {ticket.projectDescription}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                {ticket.vendor.rating.toFixed(1)} ({ticket.vendor.reviewCount})
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {ticket.vendor.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(ticket.createdAt)}
                              </span>
                            </div>

                            {ticket.quotedAmount && (
                              <div className="flex items-center gap-1 text-sm font-medium text-green-600 mb-2">
                                <DollarSign className="w-4 h-4" />
                                ${ticket.quotedAmount.toLocaleString()}
                              </div>
                            )}

                            {ticket.vendorNotes && (
                              <div className="bg-muted p-3 rounded-md mb-2">
                                <div className="text-sm font-medium mb-1">Vendor Notes:</div>
                                <div className="text-sm">{ticket.vendorNotes}</div>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setShowDetailsModal(true);
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedTicket(ticket);
                                setShowMessageModal(true);
                              }}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Send Message
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedTicketForDelete(ticket.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </ProjectTabs>

        {/* Modals */}
        {selectedTicket && (
          <>
            <TicketDetailsModal
              ticket={selectedTicket}
              isOpen={showDetailsModal}
              onClose={() => {
                setShowDetailsModal(false);
                setSelectedTicket(null);
              }}
            />
            <SendMessageModal
              ticket={selectedTicket}
              isOpen={showMessageModal}
              onClose={() => {
                setShowMessageModal(false);
                setSelectedTicket(null);
              }}
            />
          </>
        )}

        <ConfirmDeleteDialog
          open={!!selectedTicketForDelete}
          onOpenChange={(open) => !open && setSelectedTicketForDelete(null)}
          onConfirm={() => {
            if (selectedTicketForDelete) {
              handleDeleteRequest(selectedTicketForDelete);
              setSelectedTicketForDelete(null);
            }
          }}
          title="Delete Quote Request"
          description="Are you sure you want to delete this quote request? This action cannot be undone."
        />
      </div>
    </div>
  );
};

export default TicketsNew;