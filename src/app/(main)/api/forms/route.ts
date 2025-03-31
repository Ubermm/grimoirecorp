//@ts-nocheck
import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { CForm } from '@/lib/db/models';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get the code query parameter
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    // If code is provided, find the specific form
    if (code) {
      const form = await CForm.findOne({ FormCode: code }).lean();
      
      if (!form) {
        return new Response(`Form with code ${code} not found`, { status: 404 });
      }
      return Response.json(form);
    } 
    // If no code is provided, return all forms
    else {
      const forms = await CForm.find({}).lean();
      return Response.json(forms);
    }
  } catch (error) {
    console.error('Error fetching forms:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}