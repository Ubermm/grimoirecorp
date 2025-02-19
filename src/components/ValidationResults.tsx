//@ts-nocheck
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

const ValidationResults = ({ validationResults, subsectionStatus }) => {
  if (!validationResults) return null;

  const allPassed = validationResults.passed.every(result => result === 'true');
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'flagged':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'in_progress':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-black border-green-800';
      case 'flagged':
        return 'bg-black border-red-800';
      case 'in_progress':
        return 'bg-black border-yellow-800';
      default:
        return 'bg-black border-blue-800';
    }
  };

  return (
    <Card className={`mt-6 ${getStatusColor(subsectionStatus)} bg-black text-white`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-white">
          {getStatusIcon(subsectionStatus)}
          Validation Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert 
          variant={allPassed ? "default" : "destructive"}
          className={`${allPassed ? "bg-black border-green-800" : "bg-black border-red-800"} text-white`}
        >
          {allPassed ? (
            <CheckCircle className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <AlertTitle className={allPassed ? "text-green-400" : "text-red-400"}>
            Status: {allPassed ? "PASSED" : "FAILED"}
          </AlertTitle>
          <AlertDescription className="mt-2">
            {validationResults.description && validationResults.description.length > 0 && (
              <ul className="list-disc pl-5 space-y-1">
                {validationResults.description.map((desc, idx) => {
                  const hasValidationResult = idx < validationResults.passed.length;
                  const isPassed = hasValidationResult === true? validationResults.passed[idx] : false;
                  
                  return (
                    <li 
                      key={idx} 
                      className={isPassed === 'true' ? "text-green-400 text-sm" : "text-red-400 text-sm"}
                    >
                      {isPassed === 'true' ? "✓ Passed: " : "✗ Failed: "}{desc}
                    </li>
                  );
                })}
              </ul>
            )}
            {(!validationResults.description || validationResults.description.length === 0) && (
              <p className={allPassed ? "text-green-400 text-sm" : "text-red-400 text-sm"}>
                {allPassed ? "All validations passed successfully." : "Validation checks failed."}
              </p>
            )}
          </AlertDescription>
        </Alert>

        {(!validationResults.passed || validationResults.passed.length === 0) && (
          <Alert className="bg-black border-blue-800 text-white">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertTitle>No Validation Results</AlertTitle>
            <AlertDescription>
              Complete the form and click "Validate & Continue" to see validation results.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ValidationResults;