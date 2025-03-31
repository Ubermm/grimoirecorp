//@ts-nocheck
//compare/route.ts
import { auth } from '@/app/(auth)/auth';
import { CWarningLetter, CCompare } from '@/lib/db/models';
import { generateText } from 'ai';
import { customModel } from '@/lib/ai';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';
import { BlobServiceClient } from '@azure/storage-blob';

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
            const data = JSON.parse(line);
            frequencyMap.set(data.code, 
                data.cooccurrences.split(", ").slice(0, 3)
            );
        }
    });
    
    return frequencyMap;
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

function generateMermaidDiagram(letterACodes: string[], letterBCodes: string[], type: 'cfr' | 'fdc'): string {
    // Helper functions remain the same
    const sanitizeForId = (code: string, prefix: string): string => {
        return prefix + '_' + code
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    };

    const escapeLabel = (code: string): string => {
        return code.replace(/["&]/g, '\\$&');
    };

    // Initialize Mermaid code with direction and styling
    let mermaidCode = `
graph TD
`;

    // Find common codes
    const commonCodes = letterACodes.filter(code => letterBCodes.includes(code));

    // Create subgraph for Letter A
    mermaidCode += `
    subgraph Letter_A["Letter A"]
        direction TB
`;
    letterACodes.forEach(code => {
        const nodeId = sanitizeForId(code, 'A');
        const label = escapeLabel(code);
        const isCommon = commonCodes.includes(code);
        mermaidCode += `        ${nodeId}["${label}"]${isCommon ? ':::common' : ':::letterA'}\n`;
    });
    mermaidCode += '    end\n';

    // Create subgraph for Letter B
    mermaidCode += `
    subgraph Letter_B["Letter B"]
        direction TB
`;
    letterBCodes.forEach(code => {
        const nodeId = sanitizeForId(code, 'B');
        const label = escapeLabel(code);
        const isCommon = commonCodes.includes(code);
        mermaidCode += `        ${nodeId}["${label}"]${isCommon ? ':::common' : ':::letterB'}\n`;
    });
    mermaidCode += '    end\n';

    // Add connections for common codes
    if (commonCodes.length > 0) {
        mermaidCode += '\n    %% Common code connections\n';
        commonCodes.forEach(code => {
            const sourceId = sanitizeForId(code, 'A');
            const targetId = sanitizeForId(code, 'B');
            mermaidCode += `    ${sourceId} ---|"Common ${type.toUpperCase()} code"|${targetId}\n`;
        });
    }

    return mermaidCode;
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

        const { firstLetter, secondLetter, firstUrl, secondUrl } = await request.json();
        
        // Extract codes from both letters
        const { text: firstLetterCodes } = await generateText({
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
                Warning Letter Content:\n${firstLetter}`
            }]
        });

        const { text: secondLetterCodes } = await generateText({
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
                Warning Letter Content:\n${secondLetter}`
            }]
        });

        const letterACodes = extractCodes(firstLetterCodes);
        const letterBCodes = extractCodes(secondLetterCodes);

        // Generate comparison visualizations
        const cfrVisualization = generateMermaidDiagram(
            letterACodes.cfrCodes,
            letterBCodes.cfrCodes,
            'cfr'
        );
        const fdcVisualization = generateMermaidDiagram(
            letterACodes.fdcCodes,
            letterBCodes.fdcCodes,
            'fdc'
        );

        const { text: analysisContent } = await generateText({
            model: customModel(DEFAULT_MODEL_NAME),
            messages: [{
                role: 'user',
                content: `You are an experienced FDA compliance expert from Grimoire.corp assisting a compliance officer. You will analyze two FDA warning letters to identify relevant insights for compliance improvements.
                Given:
                The main warning letter issued to the compliance officer's firm (LETTER A)
                A reference warning letter from another firm (LETTER B)
                Instructions:
                First, identify all distinct violations in LETTER B.
                For each violation in LETTER B:
                Extract the specific regulatory requirements cited
                Identify the underlying quality system or procedural failures
                Note any technical details about how the violation was discovered
                Analyze potential connections to LETTER A by considering:
                Direct overlaps in regulatory citations
                Similar root causes or quality system failures
                Related processes or control points
                Common technical or procedural vulnerabilities
                Comparable documentation or data integrity issues
                Provide actionable insights:
                Highlight any warning signs in LETTER B that could indicate potential blind spots in addressing LETTER_A's violations
                Identify preventive measures from LETTER B that could strengthen compliance beyond just addressing LETTER_A's direct findings
                Note any industry trends or FDA focus areas revealed by comparing both letters
                Format your response as follows in Markdown, for the compliance officer as your audience:
                Violation analysis from Letter B:
                [List each violation with regulatory citations and key findings]
                Connections to Letter A:
                [Detail relationships between violations, categorized by type of connection]
                Risk Assessment:
                [Evaluate implications for compliance program improvements]
                Recommended Actiosn:
                [Specific steps to enhance compliance based on both letters' insights]
                Note: Format your report in Markdown format, Focus on systemic and procedural relationships between violations, not just superficial similarities. Consider how addressing one type of violation might prevent or reveal others.
                LETTER A:${firstLetter}\nLETTER B${secondLetter}`
            }]
        });

        const compare = await CCompare.create({
            userId: session.user.id,
            content: analysisContent,
            firstUrl,
            secondUrl,
            cfrVisualization,
            fdcVisualization,
            letterACodes: {
                cfrCodes: letterACodes.cfrCodes,
                fdcCodes: letterACodes.fdcCodes
            },
            letterBCodes: {
                cfrCodes: letterBCodes.cfrCodes,
                fdcCodes: letterBCodes.fdcCodes
            }
        });

        return Response.json({
            content: analysisContent,
            cfrVisualization,
            fdcVisualization,
            firstUrl,
            secondUrl,
            letterACodes: {
                cfrCodes: letterACodes.cfrCodes,
                fdcCodes: letterACodes.fdcCodes
            },
            letterBCodes: {
                cfrCodes: letterBCodes.cfrCodes,
                fdcCodes: letterBCodes.fdcCodes
            }
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

        const results = await CCompare.find({ userId: session.user.id });

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
        await CCompare.findOneAndDelete({ _id: id, userId: session.user.id });
        return new Response('Chat and associated attachments deleted', { status: 200 });
    } catch (error: any) {
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