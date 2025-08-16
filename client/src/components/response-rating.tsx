import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Award, Medal, CheckCircle, XCircle, Anchor } from "lucide-react";

interface ResponseRatingProps {
  responseId: string;
  currentRating?: string;
  onRatingChange: (responseId: string, rating: string) => void;
}

export function ResponseRating({ responseId, currentRating, onRatingChange }: ResponseRatingProps) {
  const [rating, setRating] = useState(currentRating || '');

  const ratings = [
    { id: 'gold', label: 'Gold Medal', icon: Crown, color: 'bg-yellow-500', textColor: 'text-yellow-800' },
    { id: 'silver', label: 'Silver Medal', icon: Award, color: 'bg-gray-400', textColor: 'text-gray-800' },
    { id: 'bronze', label: 'Bronze Medal', icon: Medal, color: 'bg-amber-600', textColor: 'text-amber-800' },
    { id: 'finished', label: 'Finished', icon: CheckCircle, color: 'bg-green-500', textColor: 'text-green-800' },
    { id: 'sank', label: 'Sank', icon: XCircle, color: 'bg-red-500', textColor: 'text-red-800' },
    { id: 'titanic', label: 'Titanic', icon: Anchor, color: 'bg-slate-800', textColor: 'text-slate-100' }
  ];

  const handleRatingClick = (ratingId: string) => {
    const newRating = rating === ratingId ? '' : ratingId;
    setRating(newRating);
    onRatingChange(responseId, newRating);
  };

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {ratings.map((r) => {
        const IconComponent = r.icon;
        const isSelected = rating === r.id;
        return (
          <Button
            key={r.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => handleRatingClick(r.id)}
            className={`h-8 px-3 text-xs transition-all ${
              isSelected 
                ? `${r.color} ${r.textColor} hover:opacity-80` 
                : 'hover:bg-gray-100'
            }`}
          >
            <IconComponent className="h-3 w-3 mr-1" />
            {r.label}
          </Button>
        );
      })}
    </div>
  );
}