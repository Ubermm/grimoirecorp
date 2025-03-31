//@ts-nocheck
import pl from 'tau-prolog';
import { queryObjects } from 'v8';

// Import and initialize the lists module
const lists = require('tau-prolog/modules/lists');
const format = require('tau-prolog/modules/format');

// Initialize the modules
lists(pl);
format(pl);

// Promisify the consult operation
function consultProgram(session: any, program: string): Promise<void> {
  return new Promise((resolve, reject) => {
    session.consult(program, {
      success: () => resolve(),
      error: (err: any) => reject(new Error(`Program consultation error: ${err}`))
    });
  });
}

// Promisify the query operation
function executeQuery(session: any, query: string): Promise<any> {
  return new Promise((resolve, reject) => {
    session.query(query, {
      success: (goal: any) => resolve(goal),
      error: (err: any) => reject(new Error(`Query error: ${err}`))
    });
  });
}

// Promisify the answer operation
function findAnswer(session: any): Promise<{ success: boolean, answer: string }> {
  return new Promise((resolve, reject) => {
    session.answer({
      success: (answer: any) => {
        resolve({ success: true, answer: session.format_answer(answer) });
      },
      error: (err: any) => reject(new Error(`Answer error: ${err}`)),
      fail: () => resolve({ success: false, answer: 'false.' }),
      limit: () => resolve({ success: false, answer: 'reached limit.' })
    });
  });
}

// Main function to execute Prolog queries
export async function executePrologQueries(
  program: string,
  queries: string[],
  limit: number = 10000
): Promise<Array<{query: string, answers: string[]}>> {
  const session = pl.create(limit);
  const results: Array<{query: string, answers: string[]}> = [];

  try {
    // First consult the program
    await consultProgram(session, program);
    // Process each query
    console.log(program);
    for (const query of queries) {
      try {
        const answers: string[] = [];
        // Set up the query
        await executeQuery(session, query);
        
        // Keep looking for answers until we get a fail
        let result = await findAnswer(session);
        
        if (result.success) {
          // If it's a variable binding, keep collecting answers
          while (result.success) {
            answers.push(result.answer);
            result = await findAnswer(session);
          }
        } else if (result.answer === 'false.') {
          // For boolean queries that fail, add the 'false.' result
          answers.push('false.');
        } else if (result.answer === 'reached limit.') {
          answers.push('reached limit.');
        }
        
        // If it was a successful boolean query with no variables (true but empty answers)
        if (answers.length === 0 && query.match(/^\w+(\([\w,\s]+\))?\.\s*$/)) {
          answers.push('true.');
        }

        results.push({
          query,
          answers
        });
      } catch (queryError) {
        console.error(`Error executing query "${query}":`, queryError);
        results.push({
          query,
          answers: []
        });
      }
    }
  } catch (error) {
    console.error('Error in Prolog execution:', error);
  }
  
  return results;
}

// Example usage
export async function test() {
  const program = `          
    % load lists module                          
    :- use_module(library(lists)).               
                                                 
    % fruit/1                                    
    fruit(apple). fruit(pear). fruit(banana).    
                                                 
    % fruits_in/2                                
    fruits_in(Xs, X) :- member(X, Xs), fruit(X). 
  `;

  const queries = [
    "fruits_in([carrot, apple, banana, broccoli], banana).",
    "fruit(apple).",
    "fruit(carrot).",
  ];

  try {
    const results = await executePrologQueries(program, queries, 2000);
  } catch (error) {
    console.error('Error:', error);
  }
}

export type PrologAnswer = {
  query: string;
  answers: string[];
};