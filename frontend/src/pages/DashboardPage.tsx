import { useAuthContext } from "../context/AuthContext";
import { useOrders } from "../hooks/useOrders";

const DashboardPage = () => {
  const { user } = useAuthContext();
  const { orders, isLoading } = useOrders();

  const lifetimeSpent =
    orders?.reduce((total, order) => {
      const orderTotal = order.items.reduce(
        (orderSum, item) => orderSum + item.price * item.quantity,
        0
      );
      return total + orderTotal;
    }, 0) || 0;

  if (isLoading) {
    return <div>Loading Dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Welcome, {user?.username || "Valued Customer"}!</h1>
        <p>Here's a summary of your account activity.</p>
      </header>

      <section className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-value">{orders?.length || 0}</span>
          <span className="stat-label">Total Orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">${lifetimeSpent.toFixed(2)}</span>
          <span className="stat-label">Lifetime Spent</span>
        </div>
      </section>

      <section className="dashboard-recent-orders">
        <h2>Recent Orders</h2>
        {orders && orders.length > 0 ? (
          <div className="orders-table-container">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id}>
                    <td className="order-id">#{order.id.slice(-6)}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`status-badge status-${order.status.toLowerCase()}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="order-total">
                      $
                      {order.items
                        .reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        )
                        .toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>You haven't placed any orders yet.</p>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;
