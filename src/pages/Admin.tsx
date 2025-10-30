import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast.error("Please log in first");
          navigate("/");
          return;
        }

        // Check if user has admin role
        const { data: roles } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("role", "admin");

        if (!roles || roles.length === 0) {
          toast.error("Access denied: Admin privileges required");
          navigate("/chat");
          return;
        }

        setIsAdmin(true);
        await loadReports();
      } catch (error) {
        console.error("Admin check error:", error);
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [navigate]);

  const loadReports = async () => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error: any) {
      console.error("Failed to load reports:", error);
      toast.error("Failed to load reports");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-primary/5 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Admin Panel</h1>
          </div>
          <Button variant="outline" onClick={() => navigate("/chat")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chat
          </Button>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            Abuse Reports ({reports.length})
          </h2>

          {reports.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No reports yet
            </p>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <Card key={report.id} className="p-4 bg-muted/50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Report ID: {report.id.slice(0, 8)}...
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reporter:</span>{" "}
                        {report.reporter_id.slice(0, 8)}...
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reported User:</span>{" "}
                        {report.reported_user_id.slice(0, 8)}...
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(report.created_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </div>
                  <div className="mt-3 p-3 bg-background rounded border border-border">
                    <p className="text-sm font-medium mb-1">Reason:</p>
                    <p className="text-sm">{report.reason}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 mt-6 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security Note
          </h3>
          <p className="text-sm text-muted-foreground">
            Only users with admin role can view this page. Reports are kept confidential
            and only accessible to administrators. Make sure to handle user reports
            appropriately and take action against violating users.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
