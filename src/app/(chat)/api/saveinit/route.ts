//@ts-nocheck
//only used for saving the first message
import { auth } from '@/app/(auth)/auth';
import { CMessage } from '@/lib/db/models';
export async function POST(request: Request) {
    try {
      const session = await auth();
  
      if (!session || !session.user) {
        return new Response('Unauthorized', { status: 401 });
      }
      
      const msg = await request.json();
      //console.log(msg);
      const doc = new CMessage(msg.message);
      await doc.save();
      return Response.json('Success! Saved context.', { status: 200 });

    } catch (error) {
      console.error('Context search error:', error);
      return new Response('Internal server error', { status: 500 });
    }
}