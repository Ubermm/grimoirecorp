//@ts-nocheck
import { generateText } from 'ai';
import { auth } from '@/app/(auth)/auth';
import { DEFAULT_MODEL_NAME } from '@/lib/ai/models';
import { CAdditional } from '@/lib/db/models';
import { customModel, AZURE } from '@/lib/ai';

// Function to extract JSON from text using regex
function extractJsonFromText(text: string): any {
  try {
    const jsonRegex = /(?<=```json\s?)([\s\S]*?)(?=\s?```)/;
    const match = text.match(jsonRegex);
    
    if (match && match[0]) {
      return JSON.parse(match[0].trim());
    }
    
    throw new Error('No JSON found between ```json and ```');
  } catch (error) {
    console.error('Failed to extract JSON:', error);
    throw error;
  }
}


// Generate validation questions for a batch of warning letters
async function generateValidationQuestions(previous: string, cfrSubsection: string, warningLetters: string[], prev: string = "") {
  
  const { text } = await generateText({
    model: AZURE("gpt-4o"),
    messages: [
      {
        role: 'user',
        content: `
                  Given three FDA warning letters generate validation questions for CFR 21 subsection for the regulatory compliance officer to answer
                  trying to assess the compliance of a firm for subsection ${cfrSubsection} only.
                  
                  We are making a form to validate compliance and some questions are already asked, they are the following: ${previous + prev};                   
                  
                  You need to generate granular validation questions, that are not already present in the above form, for the compliance officer to answer.
                  The questions should be generated for the CFR 21 subsection ${cfrSubsection} only, and you need to base your questions on the reasons that
                  the FDA has listed in the warning letters to the firms. In essence we are trying to add questions based on the reasons that the FDA has
                  listed in the warning letters to the firms, to help firms discvoer non-compliance using hindsight of the given FDA warning letters.
                  
                  The three warning letters are: ${warningLetters[0].content} END OF FIRST LETTER, ${warningLetters[1].content} END OF SECOND LETTER, ${warningLetters[2].content} END OF THIRD LETTER.
                  
                  Generate a JSON object that represents all compliance requirements as a structured form with validation rules. You must:

                1. Convert all requirements into questions that can be answered using only these input types:
                - SELECT: For yes/no or enumerated choices (including boolean conditions)
                - CHECKBOX: For multiple-choice selections
                - NUMERIC: For all numerical inputs

                2. Ensure type safety by:
                - Using SELECT instead of boolean inputs (e.g., options: ["yes", "no"])
                - Maintaining consistent types in comparisons (no mixing of types)
                - Using appropriate operators for each type
                - Adding range validations for NUMERIC inputs where applicable

                3. Create tau-Prolog facts and rules that:
                - Use numerical placeholders ({1}, {2}, etc.) corresponding to question IDs
                - Handle type compatibility in all comparisons
                - For SELECT inputs, compare the actual option values in rules (e.g., Value1 == "yes")
                - For NUMERIC inputs, use arithmetic comparison operators
                - For CHECKBOX inputs, handle multiple selections appropriately
                - Generated facts and rules should be consistent with tau-Prolog's requirements.

                4. Generate queries that:
                - Validate every requirement mentioned in the CFR subsection exhaustively and completely.
                - Include detailed descriptions of what specific requirement is being validated
                - Use consistent types throughout the validation chain
                - Start with ?- and end with .
                - Use valid, compatible data types to avoid non-evaluable comparisons in tau-Prolog (e.g., avoid direct comparisons between 'true' and 1).
                
                Generate valid a JSON object, with all fields and sub-fields present, even if they are empty.
                Take care of the rules.
                Output JSON Schema(STRICT):
                {
                    "questions": [
                        {
                            "id": "q1",
                            "type": "SELECT | CHECKBOX | NUMERIC",
                            "text": "question text",
                            "options": ["option1", "option2"],  // Required for SELECT/CHECKBOX
                            "range": {"min": number, "max": number},  // Required for NUMERIC
                            "cfr_reference": "specific part reference"
                        }
                    ],
                    "facts": [
                        {
                            "template": "fact_name({3}).",
                            "question_id": "q3",
                            "description": "what this fact represents",
                        }
                    ],
                    "validations": [
                        {
                            "rule": "validation_rule(Value1, Value2) :- fact1(Value1), fact2(Value2), Value1 == \"yes\".",
                            "description": "validates requirement from part (a)",
                            "operators_used": [":", "-", ",", "=="],
                        }
                    ],
                    "queries": [
                        {
                            "query": "?- validation_rule({1}, {2}).",
                            "description": "Validates that [specific requirement] from section [X] is met by checking [exact condition]",
                            "validation_rule": "validation_rule",
                        }
                    ]
                }

                Type Safety Requirements:
                1. SELECT inputs:
                - Always compare with exact option values (e.g., == "yes", == "no")
                - Use string comparison operators (==, \==)
                - Document option values in validation rules

                2. NUMERIC inputs:
                - Use arithmetic operators (>, <, >=, =<, =:=, =\=)
                - Include range validations where applicable
                - Ensure all numeric comparisons use compatible units

                3. CHECKBOX inputs:
                - Handle as lists of selected options
                - Use appropriate list operations for validation
                - Compare against specific option values

                remember {x} will be the placeholder for the answer to question x.
                The json schema is strict, also don't make the mistake of making it questions[i].question, it's questions[i].text 
                according to the schema. Look at the schema carefully.
                Generate a valid json object with all fields and sub-fields present, even if they are empty.
                Begin the json block with \`\`\`json and end with \`\`\`
                Moreover the types of the questions are SELECT, CHECKBOX and NUMERIC. Always must be in uppercase.
                Include all fields mentioned in the schema for example for questions: cfr_reference, type, options, range, etc. Similarly mention every subfield for other types, like facts, queries etc.
                
                In essence we are trying to check if the firm has taken necessary steps to avoid getting rejected by the FDA for the reasons listed in the warning letters.
                For example if a firm has conducted invesitgations for Out-of-Specification(OOS) failures, they may not have done it for all batches, so you need to add a questions that checks that. 
        `
      }
    ]
  });
  return text.replaceAll("\\\\", "REPLACE_FOR_BACKSLASH");
}

// Merge two JSON objects from different batches
function mergeJsonResults(batch1: any, batch2: any): any {
  // Create a merged JSON structure
  const merged = {
    questions: [...batch1.questions || [], ...batch2.questions || []],
    facts: [...batch1.facts || [], ...batch2.facts || []],
    validations: [...batch1.validations || [], ...batch2.validations || []],
    queries: [...batch1.queries || [], ...batch2.queries || []]
  };
  
  // Ensure IDs are unique for questions
  const seenIds = new Set();
  merged.questions = merged.questions.filter(question => {
    if (seenIds.has(question.id)) {
      return false;
    }
    seenIds.add(question.id);
    return true;
  });
  
  return merged;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const { cfrSubsection, warningLetters, form = {} } = await request.json();
    
    const resp = await CAdditional.find({ cfrCode: cfrSubsection });

    if(resp[0]){
      
      return Response.json({ form: JSON.parse(resp[0].FormText) }, { status: 200 });
    }
    
    const previous = form;
    

    // Split warning letters into two batches of three
    const batch1 = warningLetters.slice(0, 3);
    const batch2 = warningLetters.slice(3, 6);
    
    const response1 = await generateValidationQuestions(previous, cfrSubsection, batch1, "");
    const response2 = await generateValidationQuestions(previous, cfrSubsection, batch2, extractJsonFromText(response1));
    
    // Extract JSON from text responses
    const json1 = extractJsonFromText(response1);
    const json2 = extractJsonFromText(response2);
    
    // Merge the results
    const mergedQuestions = mergeJsonResults(json1, json2);
    
    await CAdditional.create({
      cfrCode: cfrSubsection,
      FormText: JSON.stringify(mergedQuestions)
    });

    return Response.json({ form: mergedQuestions }, { status: 200 });
  } catch (error) {
    console.error('Error generating validation questions:', error);
    return new Response('Internal server error', { status: 500 });
  }
}