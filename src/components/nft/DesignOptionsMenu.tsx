import { MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import DeleteButton from './DeleteButton';

interface DesignOptionsMenuProps {
  designId: string;
  userId: string;
  designName: string;
  isOwner: boolean;
}

const DesignOptionsMenu = ({ designId, userId, designName, isOwner }: DesignOptionsMenuProps) => {
  if (!isOwner) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DeleteButton 
          designId={designId} 
          userId={userId} 
          designName={designName} 
          size="sm" 
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DesignOptionsMenu;