import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch foods from backend
  useEffect(() => {
    fetchFoods();
  }, []);

  const fetchFoods = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/foods');
      setFoods(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load foods');
      setLoading(false);
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <h2>Loading...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={{ color: 'red' }}>{error}</h2>
        <button onClick={fetchFoods}>Retry</button>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1>🍔 Food Delivery</h1>
        <p>Order your favorite food now!</p>
      </header>

      <div style={styles.container}>
        <h2 style={styles.sectionTitle}>Popular Foods</h2>
        <div style={styles.foodsGrid}>
          {foods.map((food) => (
            <div key={food.id} style={styles.foodCard}>
              <div style={styles.foodEmoji}>{food.emoji}</div>
              <h3 style={styles.foodName}>{food.name}</h3>
              <p style={styles.foodDescription}>{food.description}</p>
              <div style={styles.foodRating}>
                {'⭐'.repeat(Math.round(food.rating))}
                <span style={styles.ratingText}>{food.rating}</span>
              </div>
              <div style={styles.foodFooter}>
                <span style={styles.foodPrice}>${food.price}</span>
                <button style={styles.orderBtn}>Order Now</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  app: {
    fontFamily: 'Arial, sans-serif',
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  header: {
    background: 'linear-gradient(135deg, #ff6b35, #ff8c5a)',
    color: 'white',
    padding: '40px 20px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: '30px',
    textAlign: 'center',
    color: '#333'
  },
  foodsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '25px'
  },
  foodCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
    textAlign: 'center'
  },
  foodEmoji: {
    fontSize: '3.5rem',
    marginBottom: '10px'
  },
  foodName: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#333'
  },
  foodDescription: {
    color: '#666',
    fontSize: '0.9rem',
    marginBottom: '12px'
  },
  foodRating: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '15px'
  },
  ratingText: {
    color: '#666',
    fontSize: '0.9rem'
  },
  foodFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #eee',
    paddingTop: '15px'
  },
  foodPrice: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: '#ff6b35'
  },
  orderBtn: {
    padding: '8px 20px',
    background: '#ff6b35',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh'
  }
};

// Add hover effect
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  .food-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
  }
  .order-btn:hover {
    background: #e55a2b;
  }
`;
document.head.appendChild(styleSheet);

export default App;