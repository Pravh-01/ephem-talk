import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

interface MatchingScreenProps {
  onLogout: () => void;
}

const MatchingScreen = ({ onLogout }: MatchingScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md animate-in fade-in zoom-in duration-500">
        <div className="mb-6">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Finding someone for you...</h2>
          <p className="text-muted-foreground">
            Hang tight! We're matching you with a random person
          </p>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-lg mb-6">
          <h3 className="font-semibold mb-3">While you wait:</h3>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Be respectful and kind to others</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>No harassment, hate speech, or inappropriate content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Images are session-only and not stored</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Use the report button if someone violates guidelines</span>
            </li>
          </ul>
        </div>

        <Button
          variant="outline"
          onClick={onLogout}
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default MatchingScreen;
