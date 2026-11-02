/**
 * components/StatusBadge.jsx
 */

import { getStatusColor, getInterviewStatusColor } from '../utils/helpers';

export const StatusBadge = ({ status, label }) => (
  <span className={`badge ${getStatusColor(status)}`}>
    {label || status}
  </span>
);

export const InterviewStatusBadge = ({ status, label }) => (
  <span className={`badge ${getInterviewStatusColor(status)}`}>
    {label || status}
  </span>
);
