//@ts-nocheck
// route.ts or getWarningLetters.ts
import { auth } from '@/app/(auth)/auth';
import { CWarningLetter } from '@/lib/db/models';

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { cfrSubsection } = await request.json();

    if (!cfrSubsection) {
      return new Response('CFR subsection is required', { status: 400 });
    }

    // Format the CFR code to ensure proper matching
    const searchCode = cfrSubsection;
    
    // Get top 6 warning letters that match the CFR subsection
    const matchingLetters = await CWarningLetter.aggregate([
      {
        $addFields: {
          // Split codes into arrays
          cfrCodesArray: { $split: ["$cfr_codes", ", "] },
        }
      },
      {
        $addFields: {
          matchedCodes: {
            $filter: {
              input: "$cfrCodesArray",
              as: "code",
              cond: {
                $regexMatch: {
                  input: "$$code",
                  regex: new RegExp(`^${searchCode.replace(/\./g, '\\.')}`)
                }
              }
            }
          }
        }
      },
      {
        $match: {
          matchedCodes: { $ne: [] }
        }
      },
      {
        $sort: {
          // Sort by recency if you have a date field, otherwise by relevance
          date: -1, // Assuming there's a date field; if not, remove this line
          "matchedCodes.0": 1 // Secondary sort by first matched code
        }
      },
      {
        $limit: 6
      },
      {
        $project: {
          _id: 1,
          content: 1,
          title: 1,
          url: 1,
          cfr_codes: 1,
          fdc_codes: 1,
          date: 1, // Include if you have this field
          matchedCodes: 1
        }
      }
    ]);

    // If we don't have enough exact matches, get more general matches if needed
    if (matchingLetters.length < 6) {
      // Get the main section from the subsection (e.g., "211" from "211.22")
      const mainSection = cfrSubsection.split('.')[0];
      const generalSearchCode = mainSection;

      const additionalLetters = await CWarningLetter.aggregate([
        {
          $addFields: {
            cfrCodesArray: { $split: ["$cfr_codes", ", "] },
          }
        },
        {
          $addFields: {
            matchedCodes: {
              $filter: {
                input: "$cfrCodesArray",
                as: "code",
                cond: {
                  $regexMatch: {
                    input: "$$code",
                    regex: new RegExp(`^${generalSearchCode.replace(/\./g, '\\.')}`)
                  }
                }
              }
            }
          }
        },
        {
          $match: {
            matchedCodes: { $ne: [] },
            _id: { $nin: matchingLetters.map(letter => letter._id) } // Exclude already found letters
          }
        },
        {
          $sort: {
            date: -1,
            "matchedCodes.0": 1
          }
        },
        {
          $limit: 6 - matchingLetters.length // Only get enough to reach 6 total
        },
        {
          $project: {
            _id: 1,
            content: 1,
            title: 1,
            url: 1,
            cfr_codes: 1,
            fdc_codes: 1,
            date: 1,
            matchedCodes: 1
          }
        }
      ]);

      // Combine both result sets
      const allMatchingLetters = [...matchingLetters, ...additionalLetters];
      
      return Response.json({ 
        warningLetters: allMatchingLetters,
        exactMatches: matchingLetters.length,
        relatedMatches: additionalLetters.length
      }, { status: 200 });
    }

    return Response.json({ 
      warningLetters: matchingLetters,
      exactMatches: matchingLetters.length,
      relatedMatches: 0
    }, { status: 200 });
  } catch (error) {
    console.error('Warning letter retrieval error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

// GET route to fetch a specific warning letter by ID
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response('Warning letter ID is required', { status: 400 });
    }

    const warningLetter = await CWarningLetter.findById(id);

    if (!warningLetter) {
      return new Response('Warning letter not found', { status: 404 });
    }

    return Response.json({ warningLetter }, { status: 200 });
  } catch (error) {
    console.error('Warning letter retrieval error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}