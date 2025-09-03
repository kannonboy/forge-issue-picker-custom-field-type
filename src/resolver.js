import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';

const resolver = new Resolver();

resolver.define('getFieldConfiguration', async (req) => {
  const { fieldId } = req.payload;
  
  try {
    console.log(`Fetching configuration for field: ${fieldId}`);
    
    // Use api.asApp() to call the API with app permissions
    const response = await api.asApp().requestJira(route`/rest/api/3/app/field/${fieldId}/context/configuration`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    const data = await response.json();
    console.log('Configuration response:', data);
    
    // Extract configuration from the values array
    const configuration = data.values && data.values.length > 0 
      ? data.values[0].configuration || {}
      : {};
    
    return {
      success: true,
      configuration: configuration
    };
  } catch (error) {
    console.error('Error fetching field configuration:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch configuration'
    };
  }
});

export const handler = resolver.getDefinitions();
