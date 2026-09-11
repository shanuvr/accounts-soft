const text = (key, label, opts = {}) => ({ key, label, type: 'text', ...opts });
const select = (key, label, options, opts = {}) => ({ key, label, type: 'select', options, ...opts });
const date = (key, label, opts = {}) => ({ key, label, type: 'date', ...opts });
const area = (key, label, opts = {}) => ({ key, label, type: 'textarea', ...opts });

const common = [
  text('technicalOwner', 'Technical Owner'),
  area('notes', 'Notes'),
];

export const PTD_TEMPLATES = {
  domain: {
    title: 'Domain Information',
    fields: [
      text('domainName', 'Domain Name', { required: true, placeholder: 'example.com' }),
      select('extension', 'Domain Extension', ['.com', '.in', '.co.in', '.net', '.org', '.io']),
      text('registrar', 'Registrar'),
      date('registrationDate', 'Registration Date'),
      date('expiryDate', 'Expiry Date'),
      select('autoRenewal', 'Auto Renewal', ['Yes', 'No']),
      text('dnsProvider', 'DNS Provider'),
      area('nameservers', 'Nameservers'),
      ...common,
    ],
  },
  hosting: {
    title: 'Hosting Information',
    fields: [
      text('hostingProvider', 'Hosting Provider'),
      text('hostingPlan', 'Hosting Plan'),
      text('serverName', 'Server Name'),
      text('ipAddress', 'IP Address'),
      select('os', 'Operating System', ['Linux', 'Windows', 'cPanel/Apache', 'Other']),
      text('storage', 'Storage'),
      text('bandwidth', 'Bandwidth'),
      date('startDate', 'Start Date'),
      date('expiryDate', 'Expiry Date'),
      ...common,
    ],
  },
  ssl: {
    title: 'SSL Information',
    fields: [
      select('certType', 'Certificate Type', ['DV', 'OV', 'EV', 'Wildcard']),
      text('certProvider', 'Certificate Provider'),
      text('certDomain', 'Domain'),
      text('certId', 'Certificate ID'),
      date('issueDate', 'Issue Date'),
      date('expiryDate', 'Expiry Date'),
      select('installStatus', 'Installation Status', ['Not Installed', 'Pending', 'Installed']),
      ...common,
    ],
  },
  website: {
    title: 'Project Information',
    fields: [
      text('projectName', 'Project Name', { required: true }),
      select('projectType', 'Project Type', ['Corporate', 'E-commerce', 'Portal', 'Web App', 'Landing Page']),
      text('frontend', 'Frontend Technology'),
      text('backend', 'Backend Technology'),
      text('repo', 'Repository'),
      text('deploymentUrl', 'Deployment URL'),
      date('projectStart', 'Project Start Date'),
      date('expectedCompletion', 'Expected Completion Date'),
      ...common,
    ],
  },
  maintenance: {
    title: 'Maintenance Information',
    fields: [
      text('service', 'Project / Service'),
      text('maintenanceType', 'Maintenance Type'),
      date('startDate', 'Start Date'),
      date('endDate', 'End Date'),
      text('sla', 'SLA'),
      text('supportHours', 'Support Hours'),
      date('renewalDate', 'Renewal Date'),
      ...common,
    ],
  },
  generic: {
    title: 'Project Information',
    fields: [
      text('projectName', 'Project Name'),
      text('technicalOwner', 'Technical Owner'),
      date('startDate', 'Start Date'),
      date('targetDate', 'Target Completion Date'),
      select('priority', 'Priority', ['Low', 'Normal', 'High', 'Urgent']),
      ...common,
    ],
  },
};

export const EMPTY_PTD_DATA = Object.fromEntries(
  Object.values(PTD_TEMPLATES).flatMap((t) => t.fields.map((f) => [f.key, '']))
);