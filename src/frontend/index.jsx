import React, { useState, useEffect } from 'react';
import ForgeReconciler, {
  Text,
  Link,
  Inline,
  Image,
  Spinner,
  Box,
} from "@forge/react";
import { view, requestJira, invoke } from '@forge/bridge';

const View = () => {
  const [fieldValue, setFieldValue] = useState(null);
  const [issueData, setIssueData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [configuration, setConfiguration] = useState(null);

  useEffect(() => {
    const loadIssueData = async () => {
      try {
        const context = await view.getContext();
        const issueKey = context.extension.fieldValue;
        setFieldValue(issueKey);

        // Fetch configuration using resolver
        try {
          const fieldId = context.extension.fieldId;
          const configResult = await invoke('getFieldConfiguration', { fieldId });
          
          if (configResult.success) {
            console.log('Fetched configuration:', configResult.configuration);
            setConfiguration(configResult.configuration || {});
          } else {
            console.error('Failed to fetch configuration:', configResult.error);
            setConfiguration({});
          }
        } catch (configError) {
          console.error('Error fetching configuration:', configError);
          setConfiguration({});
        }

        if (issueKey) {
          setIsLoading(true);
          setError(null);

          // Fetch issue details from Jira API
          const response = await requestJira(`/rest/api/3/issue/${issueKey}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const issue = await response.json();
            setIssueData({
              key: issue.key,
              summary: issue.fields.summary,
              issueType: {
                name: issue.fields.issuetype.name,
                iconUrl: issue.fields.issuetype.iconUrl,
              },
              url: `${context.siteUrl}/browse/${issue.key}`,
            });
          } else {
            setError('Failed to load issue details');
          }
        }
      } catch (e) {
        console.error('Error loading issue data:', e);
        setError('Error loading issue details');
      } finally {
        setIsLoading(false);
      }
    };

    loadIssueData();
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <Box>
        <Inline space="space.100" alignBlock="center">
          <Spinner size="small" />
          <Text>Loading issue details...</Text>
        </Inline>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box>
        <Text appearance="danger">{error}</Text>
      </Box>
    );
  }

  // Show empty state
  if (!fieldValue) {
    return (
      <Box>
        <Text appearance="subtle">No issue selected</Text>
      </Box>
    );
  }

  // Show issue data
  if (issueData) {
    console.log(issueData);
    return (
      <Inline space="space.050" alignBlock="center">        
        {/* Issue key as a link */}
        <Box>
          <Link href={issueData.url} openNewTab>
            <Text weight="bold">{issueData.key}</Text>
          </Link>
        </Box>
        
        {/* Issue summary */}
        <Box>
          <Text>{issueData.summary}</Text>
        </Box>
      </Inline>
    );
  }

  // Fallback - just show the issue id
  return (
    <Box>
      <Text>{fieldValue}</Text>
    </Box>
  );
};

ForgeReconciler.render(
  <React.StrictMode>
    <View />
  </React.StrictMode>
);
