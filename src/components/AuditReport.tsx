//@ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFViewer,
  Image,
  Font,
  pdf 
} from '@react-pdf/renderer';
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { parse } from 'path';

// Register custom fonts
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-600.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Open Sans'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    borderBottom: '1 solid #333',
    paddingBottom: 10
  },
  headerText: {
    fontSize: 10,
    color: '#666'
  },
  logo: {
    width: 120,
    height: 40,
    objectFit: 'contain'
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 20,
    color: '#1a1a1a'
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 15,
    marginTop: 30,
    color: '#333'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 10,
    marginTop: 20,
    color: '#444'
  },
  text: {
    fontSize: 10,
    marginBottom: 5,
    color: '#333'
  },
  table: {
    display: 'table',
    width: '100%',
    marginBottom: 10,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    height: 'auto', // Ensure rows adjust to content
    alignItems: 'center', // Align properly
  },  
  tableHeader: {
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf', // Ensure clear separation from rows
  },  
  tableCell: {
    padding: 5,
    fontSize: 9,
    flexShrink: 1, // Allow cells to shrink if needed
  },
  questionCell: {
    flex: 3,
    padding: 5,
    fontSize: 9,
    flexShrink: 1, // Allow cells to shrink if needed
  },
  cfrCell: {
    flex: 1,
    padding: 5,
    fontSize: 9,
    color: '#666'
  },
  responseCell: {
    flex: 2,
    padding: 5,
    fontSize: 9
  },
  validationResult: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#f9f9f9'
  },
  deepValidationResult: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#f0f4f8'
  },
  validationPassed: {
    fontSize: 10,
    marginBottom: 5,
    color: '#22c55e'
  },
  validationFailed: {
    fontSize: 10,
    marginBottom: 5,
    color: '#ef4444'
  },
  metadataRow: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'center'
  },
  questionText: {
    fontSize: 9,
    color: '#333',
  },
  metadataLabel: {
    fontSize: 10,
    fontWeight: 1000,
    color: '#444',
    width: 100,
  },
  metadataValue: {
    fontSize: 10,
    fontWeight: 400,
    color: '#222',
    flex: 1,
  },
  disclaimer: {
    fontSize: 8,
    color: '#666',
    marginTop: 30,
    borderTop: '1 solid #999',
    paddingTop: 10
  },
  edgeCasesSection: {
    marginTop: 20,
    paddingTop: 20, // Ensure it doesn't overlap
    borderTop: '1 solid #999',
  },  
  edgeCasesTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 10,
    color: '#333'
  },
  warning: {
    backgroundColor: '#fff9e6',
    padding: 8,
    borderRadius: 4,
    marginBottom: 10
  },
  warningText: {
    fontSize: 9,
    color: '#b45309'
  }
});

// Helper function to fetch question details
const getQuestionDetails = async (questionId, subsectionCode) => {
  try {
    // Fetch regulation data
    const regsResponse = await fetch(`/api/regulations?code=${encodeURIComponent(subsectionCode)}`);
    if (!regsResponse.ok) throw new Error('Failed to fetch regulation');
    const regulation = await regsResponse.json();

    // Get form code from regulation
    const formKey = regulation.FormCode;
    if (!formKey) throw new Error('No form code found in regulation');

    // Fetch form data
    const formsResponse = await fetch(`/api/forms?code=${encodeURIComponent(formKey)}`);
    if (!formsResponse.ok) throw new Error('Failed to fetch form');
    const form = await formsResponse.json();

    // Find and return matching question
    return form.FormText.questions.find(q => q.id === questionId) || null;
  } catch (error) {
    console.error('Error fetching question details:', error);
    return null;
  }
};

// Helper function to load deep questions
const loadDeepQuestions = async (code, currentFormData) => {
  try {
    const warnL = await fetch('/api/topk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cfrSubsection: code
      })
    });
    
    const Ls = await warnL.json();
    
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cfrSubsection: code,
        form: currentFormData,
        warningLetters: Ls.warningLetters || []
      })
    });
    
    if (!response.ok) throw new Error('Failed to load deep questions');
    
    return await response.json();
  } catch (error) {
    console.error('Error loading deep questions:', error);
    return null;
  }
};

const AuditReportDoc = ({ audit, questionDetails, deepForms }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Image 
            src="/logoo.png" 
            style={styles.logo}
          />
          <View>
            <Text style={styles.headerText}>Generated: {formatDate(new Date())}</Text>
            <Text style={styles.headerText}>Audit ID: {audit._id}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Compliance Audit Report</Text>
        
        {/* Metadata */}
        <View style={styles.metadata}>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Audit Name:</Text>
            <Text style={styles.metadataValue}>{audit.name}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Facility:</Text>
            <Text style={styles.metadataValue}>{audit.metadata?.facility || 'N/A'}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Department:</Text>
            <Text style={styles.metadataValue}>{audit.metadata?.department || 'N/A'}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Reviewer:</Text>
            <Text style={styles.metadataValue}>{audit.metadata?.reviewer || 'N/A'}</Text>
          </View>
          <View style={styles.metadataRow}>
            <Text style={styles.metadataLabel}>Audit Type:</Text>
            <Text style={styles.metadataValue}>{audit.metadata?.auditType || 'N/A'}</Text>
          </View>
        </View>

        {/* Subsections */}
        {audit.subsections.map((subsection, index) => (
          <View key={subsection.id}>
            <Text style={styles.subtitle}>
              Section {index + 1}: {subsection.code}
            </Text>

            {/* Questions and Responses */}
            <View style={styles.table}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={styles.questionCell}>Question</Text>
                <Text style={styles.cfrCell}>CFR Reference</Text>
                <Text style={styles.responseCell}>Response</Text>
              </View>
              
              {/* Show questions for this subsection from questionDetails */}
              {Object.entries(questionDetails)
              .filter(([questionId, question]) => parseInt(question.cfr_reference) === parseInt(subsection.code))
              .map(([questionId, question]) => {
                {
                  // Find corresponding response if it exists
                  const response = subsection.responses?.find(r => r.questionId === questionId);
                  
                  return (
                    <View key={questionId} style={styles.tableRow}>
                      <View style={styles.questionCell}>
                        <Text style={styles.questionText}>
                          {question.text || 'Loading...'}
                        </Text>
                      </View>
                      <View style={styles.cfrCell}>
                        <Text style={styles.questionText}>
                          {question.cfr_reference || 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.responseCell}>
                        <Text style={styles.questionText}>
                          {response?.answer || 'Not Answered'}
                        </Text>
                      </View>
                    </View>
                  );
                }
                return null;
              })}
            </View>

            {/* Standard Validation Results */}
            <View style={styles.validationResult}>
              <Text style={styles.sectionTitle}>Standard Validation Results</Text>
              {subsection.validationResults ? (
                <>
                  <Text style={subsection.validationResults.passed.every(result => result === 'true') ? styles.validationPassed : styles.validationFailed}>
                    Status: {subsection.validationResults.passed.every(result => result === 'true') ? 'PASSED' : 'FAILED'}
                  </Text>
                  {subsection.validationResults.description?.map((desc, idx) => {
                    const hasValidationResult = idx < subsection.validationResults.passed.length;
                    const isPassed = hasValidationResult ? subsection.validationResults.passed[idx] === 'true' : false;
                    return (
                      <Text key={idx} style={isPassed ? styles.validationPassed : styles.validationFailed}>
                        {isPassed ? "• Passed: " : "• Failed: "} {desc}
                      </Text>
                    );
                  })}
                </>
              ) : (
                <Text style={styles.text}>No validation results available - Not Answered</Text>
              )}
            </View>

            {/* Edge Cases (Deep Form) Section */}
            <View style={styles.edgeCasesSection}>
              <Text style={styles.edgeCasesTitle}>Edge Cases Analysis</Text>
              
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={styles.questionCell}>Edge Case question</Text>
                  <Text style={styles.cfrCell}>CFR Reference</Text>
                  <Text style={styles.responseCell}>Response</Text>
                </View>
                {deepForms[subsection.code]?.questions ? (
                  deepForms[subsection.code].questions
                  .filter((question, qidx) => parseInt(question.cfr_reference) == parseInt(subsection.code))
                  .map((question, qIdx) => {
                    const response = subsection.deepResponses?.[qIdx] || 'Not Answered';
                    
                    return (
                      <View key={qIdx} style={styles.tableRow}>
                        <View style={styles.questionCell}>
                          <Text style={styles.questionText}>
                            {question.text || 'Loading...'}
                          </Text>
                        </View>
                        <View style={styles.cfrCell}>
                          <Text style={styles.questionText}>
                            {question.cfr_reference || 'N/A'}
                          </Text>
                        </View>
                        <View style={styles.responseCell}>
                          <Text style={styles.questionText}>
                            {response?.answer || 'Not Answered'}
                          </Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <View style={styles.tableRow}>
                    <Text style={styles.questionCell}>No edge cases available</Text>
                    <Text style={styles.responseCell}>Not Applicable</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Deep Validation Results */}
            <View style={styles.deepValidationResult}>
              <Text style={styles.sectionTitle}>Edge Cases Validation Results</Text>
              {subsection.deepValidationResults ? (
                <>
                  <Text style={subsection.deepValidationResults.passed.every(result => result === 'true') ? styles.validationPassed : styles.validationFailed}>
                    Status: {subsection.deepValidationResults.passed.every(result => result === 'true') ? 'PASSED' : 'FAILED'}
                  </Text>
                  {subsection.deepValidationResults.description?.map((desc, idx) => {
                    const hasValidationResult = idx < subsection.deepValidationResults.passed.length;
                    const isPassed = hasValidationResult ? subsection.deepValidationResults.passed[idx] === 'true' : false;
                    return (
                      <Text key={idx} style={isPassed ? styles.validationPassed : styles.validationFailed}>
                        {isPassed ? "• Passed: " : "• Failed: "} {desc}
                      </Text>
                    );
                  })}
                </>
              ) : (
                <Text style={styles.text}>No validation results available - Not Answered</Text>
              )}
            </View>

            {/* Comments */}
            <View style={styles.validationResult}>
              <Text style={styles.sectionTitle}>Auditor Comments</Text>
              <Text style={styles.text}>{subsection.comment || 'No comments provided'}</Text>
            </View>
          </View>
        ))}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          DISCLAIMER: This report was automatically generated by Grimoire.Corp's compliance audit tool. 
          While we strive to ensure the accuracy and reliability of our automated systems, this report 
          is provided "as is" without warranty of any kind, either expressed or implied, including, but 
          not limited to, the implied warranties of merchantability and fitness for a particular purpose. 
          
          © {new Date().getFullYear()} Grimoire.Corp. All rights reserved.
        </Text>
      </Page>
    </Document>
  );
};

// We also need to modify the AuditReport component to fetch ALL questions
const AuditReport = ({ audit }) => {
  const [questionDetails, setQuestionDetails] = useState({});
  const [deepForms, setDeepForms] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        // Fetch all questions for each subsection
        const details = {};
        for (const subsection of audit.subsections) {
          try {
            // Fetch all questions for this subsection's form
            const regsResponse = await fetch(`/api/regulations?code=${encodeURIComponent(subsection.code)}`);
            if (!regsResponse.ok) throw new Error('Failed to fetch regulation');
            const regulation = await regsResponse.json();

            // Get form code from regulation
            const formKey = regulation.FormCode;
            if (!formKey) throw new Error('No form code found in regulation');
            const formsResponse = await fetch(`/api/forms?code=${encodeURIComponent(formKey)}`);
            if (formsResponse.ok) {
              const formData = await formsResponse.json();
              
              // Add all questions from the form to our details object
              if (formData.FormText && formData.FormText.questions) {
                formData.FormText.questions.forEach(question => {
                  details[question.id] = question;
                });
              }
            }
          } catch (error) {
            console.error(`Failed to fetch questions for subsection ${subsection.code}:`, error);
          }
        }
        setQuestionDetails(details);

        // Fetch deep form data for each subsection
        const deepFormsData = {};
        for (const subsection of audit.subsections) {
          // Create a simple form representation to pass to the API
          const currentFormData = {
            responses: subsection.responses?.reduce((acc, response) => {
              acc[response.questionId] = response.answer;
              return acc;
            }, {}) || {}
          };

          const deepFormResult = await loadDeepQuestions(subsection.code, currentFormData);
          if (deepFormResult) {
            deepFormsData[subsection.code] = deepFormResult.form;
          }
        }
        setDeepForms(deepFormsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [audit]);

  const openInNewWindow = async () => {
    const blob = await pdf(<AuditReportDoc audit={audit} questionDetails={questionDetails} deepForms={deepForms} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return <div>Loading audit report...</div>;
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={openInNewWindow}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Open in New Window
        </Button>
      </div>
      
      <div className="flex-1">
        <PDFViewer className="w-full h-full">
          <AuditReportDoc audit={audit} questionDetails={questionDetails} deepForms={deepForms} />
        </PDFViewer>
      </div>
    </div>
  );
};

export default AuditReport;