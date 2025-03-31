"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { toast } from 'sonner';

const BookDemo = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'Book a Demo Request',
    message: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      subject: 'Book a Demo Request',
      message: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to submit');

      toast.success('Demo Request Sent', {
        description: "We'll get back to you soon to schedule a demo."
      });

      resetForm();
    } catch (error) {
      toast.error('Error Sending Request', {
        description: "Please try again or contact us directly via email."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/Header.jpg')" }}>
      <div className="container mx-auto py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-6 text-center">Book a Demo</h1>
          <p className="text-xl text-white/60 text-center mb-12">
            Experience our platform in action. Schedule a demo today.
          </p>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Schedule a Demo</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-white mb-2">Name</label>
                  <Input 
                    name="name"
                    type="text" 
                    placeholder="Your name"
                    required
                    className="w-full bg-black border-white/20 text-white"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Email</label>
                  <Input 
                    name="email"
                    type="email" 
                    placeholder="your@email.com"
                    required
                    className="w-full bg-black border-white/20 text-white"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-white mb-2">Message</label>
                  <Textarea 
                    name="message"
                    placeholder="Preferred time slots, questions, or special requests..."
                    className="w-full bg-black border-white/20 text-white min-h-[150px]"
                    value={formData.message}
                    onChange={handleChange}
                  />
                </div>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? 'Sending...' : 'Request Demo'}
                </Button>
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Contact Information</h2>
              <Card className="bg-black border border-white/10 p-6">
                <div className="flex items-start space-x-4">
                  <Calendar className="w-6 h-6 text-purple-500" />
                  <div>
                    <h3 className="text-white font-semibold mb-1">Email</h3>
                    <p className="text-white/60">support@grimoire.tools</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDemo;
