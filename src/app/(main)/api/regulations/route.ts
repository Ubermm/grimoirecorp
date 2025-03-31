//@ts-nocheck
import { NextRequest } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { CRegulation } from '@/lib/db/models';

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
      const reg = await CRegulation.findOne({ RegCode: code }).lean();
      
      if (!reg) {
        return new Response(`reg with code ${code} not found`, { status: 404 });
      }
      return Response.json(reg);
    } 
    // If no code is provided, return all regs
    else {
      const pipeline = [
        // Project to keep only the fields we need
        {
          $project: {
            _id: 0,
            RegCode: 1,
            RegText: 1
          }
        },
        // Group all documents into a single document with key-value pairs
        {
          $group: {
            _id: null,
            regulations: {
              $push: {
                k: "$RegCode",
                v: "$RegText"
              }
            }
          }
        },
        // Convert the array of k-v pairs into a single object
        {
          $project: {
            _id: 0,
            regulations: {
              $arrayToObject: "$regulations"
            }
          }
        },
        // Restructure to return just the regulations object
        {
          $replaceRoot: {
            newRoot: "$regulations"
          }
        }
      ];
      const regulations = await CRegulation.aggregate(pipeline);
      // The pipeline returns an array with one object - the formatted regulations
      return Response.json(regulations[0] || {});
    }
  } catch (error) {
    console.error('Error fetching regs:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}