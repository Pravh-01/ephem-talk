import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

const Login = () => {
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/chat");
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    setIsLoading(true);

    try {
      // Sign in anonymously with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInAnonymously();

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create anonymous session");

      // Create user profile linked to auth user
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert([{ 
          nickname: nickname.trim(),
          user_id: authData.user.id 
        }])
        .select()
        .single();

      if (userError) throw userError;

      // Assign default 'user' role
      await supabase
        .from("user_roles")
        .insert([{ 
          user_id: authData.user.id,
          role: 'user' 
        }]);

      toast.success(`Welcome, ${userData.nickname}!`);
      navigate("/chat");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-primary/5">
      <div className="w-full max-w-md">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary-glow mb-4 shadow-lg">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Random Chat
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect with random people instantly
          </p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="nickname" className="text-sm font-medium">
                Choose a nickname
              </label>
              <Input
                id="nickname"
                type="text"
                placeholder="Enter your nickname..."
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                disabled={isLoading}
                className="text-lg h-12"
              />
              <p className="text-xs text-muted-foreground">
                This is how others will see you
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-opacity"
            >
              {isLoading ? "Starting..." : "Start Chatting"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              By continuing, you agree to be respectful and follow community guidelines
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
