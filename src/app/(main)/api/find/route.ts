//@ts-nocheck
//find/route.ts
import { auth } from '@/app/(auth)/auth';
import { CWarningLetter, CFind } from '@/lib/db/models';
import { generateText } from 'ai';
import { customModel } from '@/lib/ai';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';
import { BlobServiceClient } from '@azure/storage-blob';
import { Schema } from 'mongoose';
import { generateUUID } from '@/lib/utils';

async function loadFrequencyData(fileName: string): Promise<Map<string, string[]>> {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AZURE_STORAGE_CONNECTION_STRING!
    );
    const containerClient = blobServiceClient.getContainerClient(
        process.env.AZURE_STORAGE_CONTAINER_NAME!
    );
    const blobClient = containerClient.getBlobClient(fileName);
    
    const downloadResponse = await blobClient.download();
    const fileContent = await streamToString(downloadResponse.readableStreamBody!);
    
    const frequencyMap = new Map<string, string[]>();
    const lines = fileContent.split('\n');
    
    lines.forEach(line => {
        if (line.trim()) {
            try {
                const data = JSON.parse(line);
                // Since cooccurrences is already a string with comma-separated values,
                // split it into an array
                frequencyMap.set(data.code, 
                    data.cooccurrences.split(", ").slice(0, 3)  // Get top 3 co-occurrences
                );
            } catch (error) {
                console.error('Error parsing line:', line, error);
            }
        }
    });
    
    return frequencyMap;
}

function generateMermaidDiagram(codes: string[], frequencyMap: Map<string, string[]>): string {
    let mermaidCode = 'graph TD\n';
    
    // Helper function to sanitize code for node IDs
    const sanitizeForId = (code: string): string => {
        return code
            .replace(/[^a-zA-Z0-9]/g, '_') // Replace any non-alphanumeric char with underscore
            .replace(/_+/g, '_')           // Replace multiple underscores with single
            .replace(/^_|_$/g, '');        // Remove leading/trailing underscores
    };
    
    // Helper function to escape special characters in labels
    const escapeLabel = (code: string): string => {
        return code.replace(/["&]/g, '\\$&'); // Escape quotes and ampersands
    };
    
    // Add all unique nodes first
    const allNodes = new Set<string>();
    codes.forEach(code => {
        allNodes.add(code);
        const relatedCodes = frequencyMap.get(code) || [];
        relatedCodes.forEach(relatedCode => allNodes.add(relatedCode));
    });
    
    // Define all nodes
    allNodes.forEach(code => {
        const nodeId = sanitizeForId(code);
        const label = escapeLabel(code);
        mermaidCode += `    ${nodeId}["${label}"]\n`;
    });
    
    // Add connections
    codes.forEach(code => {
        const relatedCodes = frequencyMap.get(code) || [];
        const sourceId = sanitizeForId(code);
        
        relatedCodes.forEach(relatedCode => {
            const targetId = sanitizeForId(relatedCode);
            mermaidCode += `    ${sourceId} --> ${targetId}\n`;
        });
    });
    
    return mermaidCode;
}

async function generateCodeFrequencyStats(
    results: any[], 
    cfrCodes: string[], 
    fdcCodes: string[]
): Promise<string> {
    // Get all warning letters except the ones in current results
    const allWarningLetters = await CWarningLetter.find({
        _id: { $nin: results.map(r => r._id) }
    });

    // Create separate maps for CFR and FD&C codes
    const cfrFrequency = new Map<string, number>();
    const fdcFrequency = new Map<string, number>();
    
    // Count occurrences of each code
    allWarningLetters.forEach(letter => {
        if (letter.cfr_codes) {
            const letterCfrCodes = letter.cfr_codes.split(', ');
            letterCfrCodes.forEach(code => {
                if (!cfrCodes.includes(code)) {
                    cfrFrequency.set(code, (cfrFrequency.get(code) || 0) + 1);
                }
            });
        }
        if (letter.fdc_codes) {
            const letterFdcCodes = letter.fdc_codes.split(', ');
            letterFdcCodes.forEach(code => {
                if (!fdcCodes.includes(code)) {
                    fdcFrequency.set(code, (fdcFrequency.get(code) || 0) + 1);
                }
            });
        }
    });
    
    // Generate summary text
    let summary = 'Most Common Related Codes:\n\nFrequent CFR Codes:\n';
    
    // Add top 5 CFR codes
    Array.from(cfrFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([code, count]) => {
            summary += `- ${code} appears in ${count} other warning letter${count !== 1 ? 's' : ''}\n`;
        });
    
    // Add top 5 FD&C codes
    summary += '\n\nFrequent FD&C Act Codes:\n';
    Array.from(fdcFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .forEach(([code, count]) => {
            summary += `- ${code} appears in ${count} other warning letter${count !== 1 ? 's' : ''}\n`;
        });
    
    return summary;
}

async function streamToString(readableStream: NodeJS.ReadableStream): Promise<string> {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        readableStream.on('data', (data) => {
            chunks.push(data.toString());
        });
        readableStream.on('end', () => {
            resolve(chunks.join(''));
        });
        readableStream.on('error', reject);
    });
}

function extractCodes(llmResponse: string): { cfrCodes: string[], fdcCodes: string[] } {
    const cfrPattern = /<BEGIN_CFR_LIST>\n(.*?)\n<END_CFR_LIST>/s;
    const fdcPattern = /<BEGIN_FDC_LIST>\n(.*?)\n<END_FDC_LIST>/s;
    
    const cfrMatch = cfrPattern.exec(llmResponse);
    const fdcMatch = fdcPattern.exec(llmResponse);
    
    return {
        cfrCodes: cfrMatch ? cfrMatch[1].trim().split(', ').filter(code => code.length > 0) : [],
        fdcCodes: fdcMatch ? fdcMatch[1].trim().split(', ').filter(code => code.length > 0) : []
    };
}


export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const { content } = await request.json();
        const { text } = await generateText({
            model: customModel(DEFAULT_MODEL_NAME),
            messages: [{
                role: 'user',
                content: `You are a specialized FDA regulatory analyst. Your task is to analyze FDA warning letters
                and extract EVERY CFR (Code of Federal Regulations) violation code AND FD&C Act code, following these exact rules:

                Create two separate lists - one for CFR codes and one for FD&C Act codes
                For CFR codes:

                List all codes in a single line inside the markers, separated by commas and spaces
                Format each code exactly as: 21 CFR x.y (not 21 CFR x(y) or CFR 21.x)
                Do not include subsections like (a), (b), (1), (2) - only use the main section numbers
                When "Parts" are mentioned, list each part number separately
                Do not include codes in the form: 21 CFR 211, 21 CFR 223 etc. They MUST be for example: 21 CFR 211.22, 21 CFR 223.10 etc.


                For FD&C Act codes:

                List all codes in a single line inside separate markers
                Format as: FD&C Act 501(x), FD&C Act 502(y)
                Include only the main section numbers and primary subsection letters
                Convert "Section 501" or "section 501" to "FD&C Act 501"


                Format must be exactly:
                <BEGIN_CFR_LIST>
                21 CFR 211.22, 21 CFR 211.25, 21 CFR 211.42
                <END_CFR_LIST>

                <BEGIN_FDC_LIST>
                FD&C Act 501(a), FD&C Act 502(f)
                <END_FDC_LIST>
                Examples:
                CFR Examples:

                Convert "21 CFR 211.84(d)(1)" to "21 CFR 211.84"
                Convert "21 CFR Parts 210 and 211" to "21 CFR 210, 21 CFR 211"
                Convert "21 CFR 820.30(a)" to "21 CFR 820.30"

                FD&C Act Examples:

                Convert "Section 501(a)(2)(B)" to "FD&C Act 501(a)"
                Convert "section 502(f)(1)" to "FD&C Act 502(f)"
                Convert "Sections 501(a)(2)(B) and 502(f)(1)" to "FD&C Act 501(a), FD&C Act 502(f)"


                If no codes are found in either category, output:
                <BEGIN_CFR_LIST>
                NO_CFR_CODES_FOUND
                <END_CFR_LIST>

                <BEGIN_FDC_LIST>
                NO_FDC_CODES_FOUND
                <END_FDC_LIST>
                Do not add any additional text or commentary. Only output the markers and codes.                    
                    Warning Letter Content:\n${content}`
            }]
        });

        const { cfrCodes, fdcCodes } = extractCodes(text);

        // Load frequency data
        const cfrFrequencyMap = await loadFrequencyData('CFR.jsonl');
        const fdcFrequencyMap = await loadFrequencyData('FDC.jsonl');

        // Generate visualizations
        const cfrVisualization = generateMermaidDiagram(cfrCodes, cfrFrequencyMap);
        const fdcVisualization = generateMermaidDiagram(fdcCodes, fdcFrequencyMap);

        // In the POST route, modify the aggregation pipeline:
        const results = await CWarningLetter.aggregate([
            {
                $addFields: {
                    // Split codes into arrays
                    cfrCodesArray: { $split: ["$cfr_codes", ", "] },
                    fdcCodesArray: { $split: ["$fdc_codes", ", "] },
                }
            },
            {
                $addFields: {
                    matchedCfrCodes: {
                        $filter: {
                            input: "$cfrCodesArray",
                            as: "code",
                            cond: {
                                $or: cfrCodes.map(searchCode => ({
                                    // Match up to the subsection
                                    $regexMatch: {
                                        input: "$$code",
                                        regex: new RegExp(`^${searchCode.replace(/\./g, '\\.').split('(')[0]}`)
                                    }
                                }))
                            }
                        }
                    },
                    matchedFdcCodes: {
                        $filter: {
                            input: "$fdcCodesArray",
                            as: "code",
                            cond: {
                                $or: fdcCodes.map(searchCode => ({
                                    // Match up to the subsection
                                    $regexMatch: {
                                        input: "$$code",
                                        regex: new RegExp(`^${searchCode.split('(')[0]}`)
                                    }
                                }))
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    totalMatches: {
                        $add: [
                            { $size: "$matchedCfrCodes" },
                            { $size: "$matchedFdcCodes" }
                        ]
                    }
                }
            },
            {
                $match: {
                    totalMatches: { $gt: 0 }
                }
            },
            {
                $sort: {
                    totalMatches: -1
                }
            },
            {
                $limit: 55
            },
            {
                $project: {
                    _id: 1,
                    cfr_codes: 1,
                    fdc_codes: 1,
                    matchedCfrCodes: 1,
                    matchedFdcCodes: 1,
                    totalMatches: 1,
                    url: 1,
                    title: 1
                }
            }
        ]);

        const stats = await generateCodeFrequencyStats(results, cfrCodes, fdcCodes);
        
        const find = await CFind.create({
            userId: session.user.id,
            results,
            summary: stats,
            cfrVisualization,
            fdcVisualization
        });

        return Response.json({
            results,
            summary: stats,
            cfrVisualization,
            fdcVisualization
        }, { status: 200 });
    } catch (error) {
        console.error('Search error:', error);
        return new Response('Internal server error', { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session || !session.user) {
            return new Response('Unauthorized', { status: 401 });
        }

        const results = await CFind.find({ userId: session.user.id });

        return Response.json({ results }, { status: 200 });
    } catch (error) {
        console.error('Module retrieval error:', error);
        return new Response('Internal server error', { status: 500 });
    }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return new Response('Not Found', { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 });
  }
  try {
    await CFind.findOneAndDelete({ _id: id, userId: session.user.id });
    return new Response('Chat and associated attachments deleted', { status: 200 });
  } catch (error : any) {
    console.error('Error during deletion:', error);
    
    if (error.message === 'Chat not found or unauthorized') {
      return new Response(error, { status: 404 });
    }
    
    return new Response(
      `Failed to delete chat and attachments: ${error.message}`, 
      { status: 500 }
    );
  }
}