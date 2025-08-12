
import { Card, CardContent } from '@/components/ui/card';
import WalletButton from '@/components/wallet/WalletButton';

const AuthCard = () => {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6 text-center">
        <WalletButton />
      </CardContent>
    </Card>
  );
};

export default AuthCard;
