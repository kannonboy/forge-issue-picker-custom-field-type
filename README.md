# Issue Picker Custom Field

This Forge app implements a custom field type for Jira that allows users to pick issues based on configurable JQL queries. The field provides a typeahead search experience and displays issue details with icons.

## Features

- **Configurable JQL Filtering**: Administrators can configure the JQL query used to filter available issues
- **Typeahead Search**: Users can search for issues with real-time filtering
- **Rich Display**: Shows issue key, summary, and issue type icon in both edit and view modes
- **Responsive UI**: Built with Atlassian UI Kit components for consistent user experience

## Installation

1. Register your own copy of this app:
```bash
forge register
```

2. Install dependencies:
```bash
npm install
```

3. Deploy the app:
```bash
forge deploy --environment development
```

4. Install the app on your Jira site:
```bash
forge install --site your-site.atlassian.net --product jira --environment development
```

## Configuration

After installation, administrators can configure the custom field:

1. Go to Jira Settings > Issues > Custom Fields
2. Find the "Issue Picker" field and click "Configure"
3. Set the **Field Display Name** (e.g., "Related Issues", "Blocked By")
4. Configure the **JQL Query** to filter available issues (e.g., `status != Done`)

### Example JQL Queries

- `status != Done` - Issues that are not in the "Done" state
- `assignee = currentUser() AND status = "In Progress"` - Current user's in-progress issues
- `project in (PROJ1, PROJ2) AND type = Bug` - Bugs from specific projects
- `created >= -30d AND priority = High` - High priority issues created in the last 30 days

## Usage

### For End Users

1. **Editing**: Click on the field to open a searchable dropdown
2. **Searching**: Type to filter issues by key or summary
3. **Selecting**: Click on an issue to select it
4. **Clearing**: Use the clear button (×) to remove the selection

### Field Display

The field displays:
- Issue type icon
- Issue key (as a clickable link)
- Issue summary

## Technical Details

- **Edit Component**: Uses Select UI Kit component with typeahead search
- **View Component**: Displays issue details with icon, key, and summary
- **Configuration**: Allows JQL query and display name customization
- **API Integration**: Uses Jira REST API v3 for issue search and details

## Permissions

The app requires the `read:jira-work` scope to access issue data and `manage:jira-configuration` to retrieve custom field configuration.

## Support

For issues or questions, please refer to the [Forge documentation](https://developer.atlassian.com/platform/forge/) or [get help](https://developer.atlassian.com/platform/forge/get-help/).
