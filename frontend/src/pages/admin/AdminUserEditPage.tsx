import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { AdminUser } from '@/types/responseTypes';

const fields: { label: string; key: keyof AdminUser }[] = [
  { label: 'User ID', key: 'userId' },
  { label: 'Email', key: 'email' },
  { label: 'Full Name', key: 'fullName' },
  { label: 'Role', key: 'role' },
  { label: 'Phone', key: 'phone' },
  { label: 'Status', key: 'status' },
  { label: 'Created At', key: 'createdAt' },
  { label: 'Updated At', key: 'updatedAt' },
];

const AdminUserEditPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const user = (location.state as { user?: AdminUser })?.user ?? null;

  if (!user) {
    return (
      <div style={styles.container}>
        <p>User data not available for ID: {userId}</p>
        <button style={styles.button} onClick={() => navigate('/admin/users')}>
          Back to Users
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1>{user.fullName}</h1>
      <table style={styles.table}>
        <tbody>
          {fields.map(({ label, key }) => (
            <tr key={key} style={styles.tr}>
              <td style={styles.labelCell}>{label}</td>
              <td style={styles.valueCell}>{user[key]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.buttonRow}>
        <button style={styles.button} onClick={() => navigate('/admin/users')}>
          Back to Users
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
    width: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '16px',
  },
  tr: {
    borderBottom: '1px solid #eee',
  },
  labelCell: {
    padding: '10px 16px',
    fontWeight: 600,
    width: '180px',
    backgroundColor: '#f9f9f9',
  },
  valueCell: {
    padding: '10px 16px',
  },
  buttonRow: {
    marginTop: '24px',
  },
  button: {
    padding: '10px 24px',
    fontSize: '14px',
    cursor: 'pointer',
    border: '1px solid #ccc',
    borderRadius: '4px',
    backgroundColor: '#fff',
  },
};

export default AdminUserEditPage;
