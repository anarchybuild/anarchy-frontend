
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border w-full py-6 mt-auto">
      <div className="container flex flex-col md:flex-row gap-4 md:gap-8 px-4 md:px-6 md:justify-between">
        <div className="flex items-center">
          <img src="/lovable-uploads/23cf023d-dab9-4f41-b965-beb7754beacc.png" alt="Anarchy Logo" className="h-6 w-auto mr-2" />
          <span className="text-sm text-muted-foreground">© 2025 Anarchy. All rights reserved.</span>
        </div>
        
        <div className="flex flex-wrap gap-4 md:gap-6">
          <Link to="/privacy" className="text-xs text-muted-foreground hover:text-primary/80 transition-colors">
            Privacy
          </Link>
          <Link to="/terms" className="text-xs text-muted-foreground hover:text-primary/80 transition-colors">
            Terms of Use
          </Link>
          <Link to="/contact" className="text-xs text-muted-foreground hover:text-primary/80 transition-colors">Contact Us</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
