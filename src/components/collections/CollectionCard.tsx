import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Collection } from '@/types/collection';

interface CollectionCardProps {
  collection: Collection;
  onClick: () => void;
}

const CollectionCard = ({ collection, onClick }: CollectionCardProps) => {
  return (
    <Card className="hover-effect cursor-pointer" onClick={onClick}>
      <CardContent className="pt-6 h-40 flex items-center justify-center bg-muted">
        {collection.preview_images && collection.preview_images.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 w-full h-full">
            {collection.preview_images.slice(0, 4).map((imageUrl, index) => (
              <div
                key={index}
                className="bg-cover bg-center rounded"
                style={{
                  backgroundImage: `url(${imageUrl})`,
                  minHeight: collection.preview_images!.length === 1 ? '100%' : 'auto'
                }}
              />
            ))}
            {Array.from({ length: 4 - collection.preview_images.length }).map((_, index) => (
              <div key={`placeholder-${index}`} className="bg-muted-foreground/10 rounded" />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>Empty Collection</p>
            <p className="text-sm">Start adding designs</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="px-6 py-4">
        <div className="w-full">
          <h3 className="font-semibold truncate">{collection.name}</h3>
          <p className="text-sm text-muted-foreground">
            {collection.item_count || 0} item{(collection.item_count || 0) !== 1 ? 's' : ''}
          </p>
          {collection.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {collection.description}
            </p>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CollectionCard;