import React, { useState, useCallback, useEffect } from 'react';
import ForgeReconciler, { Select, Text, Spinner } from '@forge/react';
import { CustomFieldEdit } from '@forge/react/jira';
import { view, requestJira, invoke } from '@forge/bridge';

const Edit = () => {
  const [value, setValue] = useState('');
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [configuration, setConfiguration] = useState(null);
  const [context, setContext] = useState(null);

  // Function to load issues based on JQL and search term
  const loadIssues = useCallback(async (searchTerm = '') => {
    if (!configuration?.jql) return;
    
    setIsLoading(true);
    try {
      // Build JQL query with search term if provided
      let jql = configuration.jql;
      if (searchTerm.trim()) {
        // Add text search to the JQL query
        jql = `(${jql}) AND (summary ~ "${searchTerm}*" OR key ~ "${searchTerm}*")`;
      }
      
      // Make API request to search for issues
      const response = await requestJira('/rest/api/3/search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jql: jql,
          maxResults: 50,
          fields: ['summary', 'issuetype', 'key'],
          expand: ['names']
        })
      });

      const data = await response.json();
      
      if (data.issues) {
        const issueOptions = data.issues.map(issue => ({
          label: `${issue.key} - ${issue.fields.summary}`,
          value: issue.id,
          description: issue.fields.issuetype?.name || 'Unknown Type'
        }));
        
        setOptions(issueOptions);
      }
    } catch (e) {
      console.error('Error loading issues:', e);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  }, [configuration]);

  // Initialize component with context and existing value
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        const ctx = await view.getContext();
        console.log('View context:', ctx);
        setContext(ctx);
        
        // Fetch configuration using resolver
        const fieldId = ctx.extension.fieldId;
        const configResult = await invoke('getFieldConfiguration', { fieldId });
        
        if (configResult.success) {
          console.log('Fetched configuration:', configResult.configuration);
          setConfiguration(configResult.configuration || {});
        } else {
          console.error('Failed to fetch configuration:', configResult.error);
          setConfiguration({});
        }
        
        // Set initial value if it exists
        if (ctx.extension.fieldValue) {
          setValue(ctx.extension.fieldValue);
        }
        
        // Load initial options will be called after configuration is set
      } catch (e) {
        console.error('Error initializing component:', e);
        setConfiguration({});
      }
    };
    
    initializeComponent();
  }, []);

  // Load initial options when configuration is available
  useEffect(() => {
    if (configuration && configuration.jql) {
      loadIssues('');
    }
  }, [configuration, loadIssues]);

  // Handle search input changes (typeahead)
  const handleInputChange = useCallback((searchTerm) => {
    loadIssues(searchTerm);
  }, [loadIssues]);

  // Handle selection change
  const handleOnChange = useCallback((selectedValue) => {
    console.log("selectedValue:", selectedValue);
    setValue(selectedValue);
  }, []);

  // Submit the selected value
  const onSubmit = useCallback(async () => {
    try {
      await view.submit(value ? value.value : '');
    } catch (e) {
      console.error('Error submitting value:', e);
    }
  }, [value]);

  if (!configuration) {
    return (
      <CustomFieldEdit onSubmit={onSubmit}>
        <Text>Loading configuration...</Text>
      </CustomFieldEdit>
    );
  }

  if (!configuration.jql) {
    return (
      <CustomFieldEdit onSubmit={onSubmit}>
        <Text>No JQL query configured. Please configure this field.</Text>
      </CustomFieldEdit>
    );
  }

  return (
    <CustomFieldEdit onSubmit={onSubmit}>
      <Select
        inputId="issue-picker-select"
        className="single-select"
        classNamePrefix="react-select"
        value={value}
        onChange={handleOnChange}
        onInputChange={handleInputChange}
        options={options}
        isLoading={isLoading}
        placeholder="Search and select an issue..."
        noOptionsMessage={() => isLoading ? "Loading..." : "No issues found"}
        isClearable={true}
        isSearchable={true}
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 })
        }}
      />
    </CustomFieldEdit>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <Edit />
  </React.StrictMode>
);
