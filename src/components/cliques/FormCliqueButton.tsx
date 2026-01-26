/**
 * Form a Clique CTA Button
 * 
 * Primary action button to create a new clique.
 * Used in CliquesTab and navigation.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';

interface FormCliqueButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export function FormCliqueButton({ 
  variant = 'default', 
  size = 'default',
  className = '',
  showIcon = true 
}: FormCliqueButtonProps) {
  return (
    <Button 
      variant={variant} 
      size={size} 
      asChild 
      className={className}
    >
      <Link to="/cliques/new">
        {showIcon && <Plus className="h-4 w-4 mr-2" />}
        Form a Clique
      </Link>
    </Button>
  );
}
