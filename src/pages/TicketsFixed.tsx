import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, MapPin, Clock, DollarSign, MessageSquare, Trash2 } from 'lucide-react';
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
  status: 'pending' | 'quoted' | 'accepted' | 'declined';
  createdAt: Date;
  quotedAmount?: number;
  vendorNotes?: string;
  projectTitle: string;
}

const TicketsFixed = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTicketForDelete, setSelectedTicketForDelete] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const fetchTicketsForProject = async (projectId: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data: quoteRequests, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('client_id', user.id)
        .eq('project_id', projectId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const vendorIds = [...new Set(quoteRequests?.map(qr => qr.vendor_id) || [])];
      const { data: vendorProfiles } = await supabase
        .from('vendor_profiles')
        .select('user_id, business_name, location, rating, total_reviews, verification_status, specialty')
        .in('user_id', vendorIds);

      const vendorsMap = new Map(vendorProfiles?.map(v => [v.user_id, v]) || []);

      const transformedTickets: Ticket[] = quoteRequests?.map(qr => {
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
          projectDescription: 'Project description',
          status: qr.status as 'pending' | 'quoted' | 'accepted' | 'declined',
          createdAt: new Date(qr.created_at),
          quotedAmount: qr.quoted_amount,
          vendorNotes: qr.vendor_notes,
          projectTitle: 'Project'
        };
      }) || [];

      setTickets(transformedTickets);
    } catch (error: any) {
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

  const handleDeleteRequest = async (ticketId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('quote_requests')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Quote request deleted successfully",
      });

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Projects & Quotes</h1>
            <p className="text-muted-foreground">Manage your projects and quotes</p>
          </div>
        </div>

        <ProjectTabs 
          activeProjectId={activeProjectId}
          onProjectChange={setActiveProjectId}
        >
          {(projectId) => (
            <div className="space-y-6">
              {loading ? (
                <div className="text-center py-8">Loading tickets...</div>
              ) : tickets.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-muted-foreground mb-4">No tickets found</div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <Card key={ticket.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{ticket.vendor.name}</h3>
                            <Badge>{ticket.status}</Badge>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button size="sm" onClick={() => handleDeleteRequest(ticket.id)} variant="destructive">
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
      </div>
    </div>
  );
};

export default TicketsFixed;