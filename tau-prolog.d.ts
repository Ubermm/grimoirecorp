// tau-prolog.d.ts
declare module 'tau-prolog' {
    export interface CallbackObject {
      success: (answer?: Answer | null) => void;
      error?: (err: Error) => void;
      fail?: () => void;
      limit?: () => void;
    }
  
    export interface Answer {
      links: Record<string, any>;
      substitution: Array<{ id: string; value: any }>;
    }
  
    export class Session {
      constructor();
      consult(program: string, callbacks: Omit<CallbackObject, 'success'> & { 
        success: () => void 
      }): void;
      query(query: string, callbacks: Omit<CallbackObject, 'success'> & { 
        success: () => void 
      }): void;
      answer(callbacks: CallbackObject): void;
      format_answer(answer: Answer): string;
    }
  }

  declare module "tau-prolog/modules/lists.js" {
    export default function lists(pl: any): void;
  }
  declare module "tau-prolog/modules/format.js" {
    export default function format(pl: any): void;
  }