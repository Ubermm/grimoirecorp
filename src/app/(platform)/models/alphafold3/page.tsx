//@ts-nocheck
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Dna,
  ArrowLeft,
  Zap,
  Users,
  FileCode,
  BarChart4,
  Book,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ModelService } from '@/services/modelService';
import { PredictionService } from '@/services/predictionService';

// Define metadata for the page
export const metadata: Metadata = {
  title: 'AlphaFold 3 | Research Platform',
  description: 'Run AlphaFold 3 predictions on your protein sequences',
};

export default async function AlphaFold3Page() {
  const session = await auth();
  
  if (!session?.user) {
    redirect('/login');
  }
  
  // Initialize the model service to fetch AlphaFold3 details
  const modelService = new ModelService();
  const predictionService = new PredictionService();
  
  // For development, ensure models are seeded
  if (process.env.NODE_ENV === 'development') {
    await modelService.seedModels();
  }
  
  // Fetch the AlphaFold3 model and user's predictions
  const models = await modelService.getModels();
  const predictions = await predictionService.getUserPredictions(session.user.id);
  
  const alphaFold3 = models.find(m => m.id === 'alphafold3') || {
    name: 'AlphaFold 3',
    description: 'State-of-the-art protein structure prediction',
    category: 'Structural Biology',
    tags: ['Protein Folding', 'DeepMind', 'Latest'],
    isNew: true,
    apiEndpoint: '/api/models/alphafold3/predict',
  };
  
  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-6">
        <Button variant="outline" size="sm" asChild>
          <Link href="/models">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Models
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-2/3">
          <div className="flex items-center mb-2">
            <Dna className="mr-2 h-6 w-6 text-blue-500" />
            <h1 className="text-3xl font-bold">{alphaFold3.name}</h1>
            {alphaFold3.isNew && (
              <Badge className="ml-3 bg-blue-500">New</Badge>
            )}
          </div>
          
          <p className="text-xl text-muted-foreground mb-6">
            {alphaFold3.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {alphaFold3.tags.map(tag => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          
          <p className="mb-6">
            AlphaFold 3 represents the latest breakthrough in computational biology from DeepMind, enabling accurate prediction of protein structures from amino acid sequences. This model builds on the success of AlphaFold 2, incorporating new advances in deep learning to deliver even higher accuracy and broader capabilities.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">GPU Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Zap className="mr-2 h-5 w-5 text-amber-500" />
                  <span>A100 or A6000 GPU</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Runtime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <FileCode className="mr-2 h-5 w-5 text-purple-500" />
                  <span>~10 min per protein</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Credit Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart4 className="mr-2 h-5 w-5 text-green-500" />
                  <span>500 credits/run</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="md:w-1/3">
          <Card>
            <CardHeader>
              <CardTitle>Run this Model</CardTitle>
              <CardDescription>
                Predict protein structures with AlphaFold 3
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                To use this model, you can either create a new notebook or upload a FASTA file for direct processing.
              </p>
              
              <div className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href="/pod/new?model=alphafold3">
                    Create Notebook
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full">
                  Upload FASTA File
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link 
                href="https://deepmind.google/technologies/alphafold/" 
                target="_blank"
                className="flex items-center text-blue-500 hover:underline"
              >
                <Book className="mr-2 h-4 w-4" />
                Documentation
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
              
              <Link 
                href="https://github.com/deepmind/alphafold" 
                target="_blank"
                className="flex items-center text-blue-500 hover:underline"
              >
                <FileCode className="mr-2 h-4 w-4" />
                GitHub Repository
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
              
              <Link 
                href="https://community.deepmind.com/c/alphafold/7" 
                target="_blank"
                className="flex items-center text-blue-500 hover:underline"
              >
                <Users className="mr-2 h-4 w-4" />
                Community Forum
                <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Tabs defaultValue="examples">
        <TabsList className="mb-4">
          <TabsTrigger value="examples">Examples</TabsTrigger>
          <TabsTrigger value="api">API Usage</TabsTrigger>
          <TabsTrigger value="parameters">Parameters</TabsTrigger>
        </TabsList>
        
        <TabsContent value="examples">
          <Card>
            <CardHeader>
              <CardTitle>Example Usage</CardTitle>
              <CardDescription>
                Here are some examples of how to use AlphaFold 3 in your notebooks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code className="text-sm font-mono">
{`# Import the AlphaFold3 client
from grimoire.models import alphafold3

# Load a protein sequence from a FASTA file
sequence = alphafold3.load_sequence("protein.fasta")

# Or define the sequence directly
sequence = "MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR"

# Run prediction
result = alphafold3.predict(
    sequence=sequence,
    max_recycles=3,
    output_dir="./results"
)

# Save the results
alphafold3.save_pdb(result, "predicted_structure.pdb")

# Visualize the result
alphafold3.visualize(result)`}
                </code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Reference</CardTitle>
              <CardDescription>
                AlphaFold 3 API endpoints and usage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">REST API</h3>
                  <p className="mb-2">
                    Endpoint: <code className="bg-muted p-1 rounded">POST {alphaFold3.apiEndpoint}</code>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Request body:
                  </p>
                  <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto">
                    <code className="text-sm font-mono">
{`{
  "sequence": "MVLSPADKTNVKAAWGKVGAHAGEYGAEAL...",  // Protein sequence
  "max_recycles": 3,                                // Optional, default: 3
  "use_templates": false,                           // Optional, default: false
  "use_amber_relaxation": true                      // Optional, default: true
}`}
                    </code>
                  </pre>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Python SDK</h3>
                  <p className="mb-2">
                    The Python SDK provides more convenient access to AlphaFold 3 functionality.
                  </p>
                  <pre className="bg-muted p-4 rounded-md mt-2 overflow-x-auto">
                    <code className="text-sm font-mono">
{`from grimoire.models import alphafold3

# Basic prediction
result = alphafold3.predict(sequence="MVLSPADKTNVKAAWGKVGAHAGEYGAEAL...")

# Advanced options
result = alphafold3.predict(
    sequence="MVLSPADKTNVKAAWGKVGAHAGEYGAEAL...",
    max_recycles=5,
    use_templates=True,
    use_amber_relaxation=True,
    output_dir="./results"
)`}
                    </code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="parameters">
          <Card>
            <CardHeader>
              <CardTitle>Model Parameters</CardTitle>
              <CardDescription>
                Configuration options for AlphaFold 3
              </CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Parameter</th>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Default</th>
                    <th className="text-left p-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-medium">sequence</td>
                    <td className="p-2">string</td>
                    <td className="p-2">Required</td>
                    <td className="p-2">Protein amino acid sequence in FASTA format or raw sequence</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">max_recycles</td>
                    <td className="p-2">integer</td>
                    <td className="p-2">3</td>
                    <td className="p-2">Number of recycle iterations. Higher values can improve accuracy but increase computation time</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">use_templates</td>
                    <td className="p-2">boolean</td>
                    <td className="p-2">false</td>
                    <td className="p-2">Whether to use template information from similar proteins</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">use_amber_relaxation</td>
                    <td className="p-2">boolean</td>
                    <td className="p-2">true</td>
                    <td className="p-2">Apply AMBER relaxation to refine the predicted structure</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2 font-medium">num_ensemble</td>
                    <td className="p-2">integer</td>
                    <td className="p-2">1</td>
                    <td className="p-2">Number of models to run in the ensemble. Higher values generally improve accuracy</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium">output_dir</td>
                    <td className="p-2">string</td>
                    <td className="p-2">./</td>
                    <td className="p-2">Directory to save output files</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}