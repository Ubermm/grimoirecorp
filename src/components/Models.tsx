//@ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Dna, Star } from 'lucide-react';

export default function Models() {
  const [models, setModels] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    // Fetch model categories
    async function fetchCategories() {
      try {
        const response = await fetch('/api/models/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        // Don't set error here, as we'll still have 'All' as a fallback
      }
    }

    // Fetch models
    async function fetchModels() {
      setLoading(true);
      try {
        const url = selectedCategory !== 'All' 
          ? `/api/models?category=${encodeURIComponent(selectedCategory)}`
          : '/api/models';
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch models');
        }
        const data = await response.json();
        setModels(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching models:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
    fetchModels();
  }, [selectedCategory]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Models
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and use models for your research
          </p>
        </div>
      </div>
      
      {/* Category filters */}
      <div className="flex mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map((category) => (
          <Button 
            key={category} 
            variant={category === selectedCategory ? "default" : "outline"} 
            className="mr-2"
            onClick={() => handleCategoryChange(category)}
          >
            {category}
          </Button>
        ))}
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && !loading && (
        <div className="p-4 bg-red-50 text-red-500 rounded-md">
          Error loading models: {error}
        </div>
      )}
      
      {/* Empty state */}
      {!loading && !error && models.length === 0 && (
        <div className="text-center py-12">
          <Dna className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-lg font-semibold">No models found</h3>
          <p className="text-muted-foreground">
            {selectedCategory !== 'All' 
              ? `No models found in the "${selectedCategory}" category` 
              : 'No models are currently available'}
          </p>
        </div>
      )}
      
      {/* Model cards */}
      {!loading && !error && models.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map(model => (
            <Card key={model.id} className="overflow-hidden flex flex-col h-full">
              <div className="relative">
                <img 
                  src={model.imageUrl || '/placeholder.jpg'} 
                  alt={model.name} 
                  className="w-full h-48 object-cover" 
                />
                {model.isNew && (
                  <Badge className="absolute top-3 right-3 bg-blue-500">
                    New
                  </Badge>
                )}
              </div>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    <Dna className="mr-2 h-5 w-5 text-blue-500" />
                    {model.name}
                  </CardTitle>
                </div>
                <CardDescription>{model.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {model.tags && model.tags.map((tag, index) => (
                    <Badge key={`${model.id}-${tag}-${index}`} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  {!model.tags && (
                    <Badge key={`${model.id}-category`} variant="outline">
                      {model.category}
                    </Badge>
                  )}
                </div>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button className="w-full" asChild>
                  <Link href={`/models/${model.id}`}>
                    Use Model
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}