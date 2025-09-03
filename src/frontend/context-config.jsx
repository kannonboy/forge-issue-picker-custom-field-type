import React, { useState, useEffect, useCallback } from 'react';
import ForgeReconciler, {
  Form,
  Label,
  Textfield,
  TextArea,
  useForm,
  FormSection,
  FormFooter,
  LoadingButton,
  Button,
  ButtonGroup,
  Text,
  SectionMessage,
  ValidMessage,
  ErrorMessage,
  Spinner,
} from "@forge/react";
import { view, requestJira } from '@forge/bridge';

const ContextConfig = () => {
  const [extensionData, setExtensionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jqlValidation, setJqlValidation] = useState({
    isValidating: false,
    isValid: null,
    error: null
  });
  const [configuration, setConfiguration] = useState(() => ({
    jql: 'project = currentProject() AND status != Done',
    displayName: 'Related Issues'
  }));
  const { handleSubmit, register, getFieldId, getValues } = useForm();

  // JQL validation function
  const validateJql = useCallback(async (jqlQuery) => {
    if (!jqlQuery || jqlQuery.trim() === '') {
      setJqlValidation({ isValidating: false, isValid: null, error: null });
      return;
    }

    setJqlValidation({ isValidating: true, isValid: null, error: null });

    try {
      const response = await requestJira('/rest/api/2/jql/parse', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queries: [jqlQuery]
        })
      });

      const result = await response.json();
      
      if (response.ok && result.queries && result.queries.length > 0) {
        const query = result.queries[0];
        if (query.errors && query.errors.length > 0) {
          // The errors array contains strings, not objects with message property
          setJqlValidation({
            isValidating: false,
            isValid: false,
            error: query.errors[0] || 'Invalid JQL query'
          });
        } else {
          setJqlValidation({
            isValidating: false,
            isValid: true,
            error: null
          });
        }
      } else {
        throw new Error('Failed to validate JQL');
      }
    } catch (error) {
      setJqlValidation({
        isValidating: false,
        isValid: false,
        error: error.message || 'Failed to validate JQL query'
      });
    }
  }, []);

  // Handle JQL input changes with debouncing
  const handleJqlChange = useCallback((event) => {
    const newJql = event.target.value;
    
    // Clear any existing timeout
    if (window.jqlValidationTimeout) {
      clearTimeout(window.jqlValidationTimeout);
    }
    
    // Set new timeout for validation
    window.jqlValidationTimeout = setTimeout(() => {
      if (newJql && typeof validateJql === 'function') {
        validateJql(newJql);
      } else if (!newJql) {
        setJqlValidation({ isValidating: false, isValid: null, error: null });
      }
    }, 500); // 500ms debounce
  }, [validateJql]);

  useEffect(() => {
    view.getContext().then(({ extension }) => {
      setExtensionData(extension);

      if (extension.configuration) {
        setConfiguration(extension.configuration);
        // Validate the existing JQL configuration
        if (extension.configuration.jql && typeof validateJql === 'function') {
          validateJql(extension.configuration.jql);
        }
      } else {
        // Validate the default JQL
        if (configuration.jql && typeof validateJql === 'function') {
          validateJql(configuration.jql);
        }
      }
    });
  }, [validateJql, configuration.jql]);

  const onSubmit = async () => {
    try {
      setIsLoading(true);
      const { jql, displayName } = getValues();
      const jqlToSave = jql || configuration.jql;
      
      // Validate JQL before saving
      if (jqlValidation.isValid === false) {
        setIsLoading(false);
        return; // Don't submit if JQL is invalid
      }
      
      // If we haven't validated yet, validate now
      if (jqlValidation.isValid === null && jqlToSave && typeof validateJql === 'function') {
        await validateJql(jqlToSave);
        // Check validation result after validation
        if (jqlValidation.isValid === false) {
          setIsLoading(false);
          return;
        }
      }
      
      await view.submit({
        configuration: {
          jql: jqlToSave,
          displayName: displayName || configuration.displayName
        }
      });
    } catch (e) {
      setIsLoading(false);
      console.error(e);
    }
  }

  if (!extensionData) {
    return <Text>Loading...</Text>;
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <FormSection>
        <Label labelFor={getFieldId('displayName')}>
          Field Display Name
        </Label>
        <Textfield 
          {...register('displayName')} 
          defaultValue={configuration.displayName}
          placeholder="Enter a display name for this field"
        />
      </FormSection>
      
      <FormSection>
        <Label labelFor={getFieldId('jql')}>
          JQL Query
          {jqlValidation.isValidating && <Spinner size="xsmall" />}
        </Label>
        <TextArea 
          {...(() => {
            const { onChange: formOnChange, ...fieldProps } = register('jql');
            return {
              ...fieldProps,
              onChange: (e) => {
                // Call the form's onChange first
                formOnChange(e);
                // Then handle our custom validation
                handleJqlChange(e);
              }
            };
          })()} 
          defaultValue={configuration.jql}
          placeholder="Enter JQL query to filter issues"
          resize="vertical"
        />
        
        {/* JQL Validation Messages */}
        {jqlValidation.isValid === true && (
          <ValidMessage>JQL query is valid</ValidMessage>
        )}
        
        {jqlValidation.isValid === false && (
          <ErrorMessage>Invalid JQL: {jqlValidation.error}</ErrorMessage>
        )}
        
        {jqlValidation.isValid === null && !jqlValidation.isValidating && (
          <SectionMessage appearance="info">
            <Text>
              This JQL query will be used to filter the available issues in the picker. 
              You can use functions like currentProject(), currentUser(), etc.
            </Text>
          </SectionMessage>
        )}
      </FormSection>
      
      <FormFooter align="start">
        <ButtonGroup>
          <Button appearance="subtle" onClick={view.close}>Close</Button>
          <LoadingButton 
            appearance="primary" 
            type="submit" 
            isLoading={isLoading}
            isDisabled={jqlValidation.isValid === false || jqlValidation.isValidating}
          >
            Save Configuration
          </LoadingButton>
        </ButtonGroup>
      </FormFooter>
    </Form>
  )
}

ForgeReconciler.render(
  <React.StrictMode>
    <ContextConfig />
  </React.StrictMode>
);
