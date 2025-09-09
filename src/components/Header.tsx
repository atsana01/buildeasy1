import React from 'react';
import { Link } from 'react-router-dom';
import { AuthButton } from '@/components/AuthButton';
import { useAuth } from '@/contexts/AuthContext';

export const Header = () => {
  const { user } = useAuth();

  return (
    <header className="w-full bg-background/90 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src="/lovable-uploads/569809aa-baff-4dfd-a37e-09697c885f6d.png" 
              alt="BuildEasy Logo" 
              className="h-24 w-auto object-contain hover:scale-105 transition-transform" 
            />
          </Link>
          
          {user && <AuthButton />}
        </div>
      </div>
    </header>
  );
};