import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ============================================
// API CONFIGURATION
// ============================================
const API_URL = 'http://localhost:5000/api';

// ============================================
// COMPONENT: App
// ============================================
function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [hoveredFood, setHoveredFood] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showLogin, setShowLogin] = useState(false);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState(null);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });
  const [authError, setAuthError] = useState('');

  // Fetch foods on component mount
  useEffect(() => {
    fetchFoods();
    if (token) {
      fetchUserProfile();
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ============================================
  // API FUNCTIONS
  // ============================================

  // Fetch foods from backend
  const fetchFoods = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/foods`);
      setFoods(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching foods:', err);
      setError('Failed to load foods. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  // Login user
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      setShowLogin(false);
      setAuthError('');
      setLoginData({ email: '', password: '' });
      alert(`Welcome ${user.username}!`);
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Login failed');
    }
  };

  // Register user
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/auth/register`, registerData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      setShowLogin(false);
      setAuthError('');
      setRegisterData({ username: '', email: '', password: '', phone: '', address: '' });
      alert(`Welcome ${user.username}! Account created successfully.`);
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Registration failed');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCart([]);
  };

  // Add to cart
  const addToCart = (food) => {
    const existingItem = cart.find(item => item.id === food.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === food.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }
    alert(`${food.name} added to cart!`);
  };

  // Place order
  const placeOrder = async () => {
    if (!user) {
      alert('Please login to place an order');
      setShowLogin(true);
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    try {
      const orderData = {
        items: cart.map(item => ({
          food_id: item.id,
          name: item.name,
          price: parseFloat(item.price.replace('$', '')),
          quantity: item.quantity
        })),
        total_amount: cart.reduce((sum, item) => 
          sum + (parseFloat(item.price.replace('$', '')) * item.quantity), 0
        ),
        delivery_address: user.address || '123 Main St, City',
        payment_method: 'cash'
      };

      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Order placed successfully! Order #' + response.data.order_number);
      setCart([]);
      setShowOrderModal(false);
      fetchOrders();
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/orders/client`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ 
            color: i <= Math.round(rating) ? '#ffc107' : '#ddd',
            fontSize: '14px'
          }}>★</span>
        ))}
      </div>
    );
  };

  // Render cart count
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => 
    sum + (parseFloat(item.price.replace('$', '')) * item.quantity), 0
  ).toFixed(2);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>🍔</div>
        <h2>Loading delicious food...</h2>
        <p>Please wait while we prepare your menu</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={{ color: '#ff6b35' }}>⚠️ {error}</h2>
        <button onClick={fetchFoods} style={styles.primaryBtn}>Retry</button>
        <p style={{ marginTop: '20px', color: '#666' }}>
          Make sure backend is running: <br />
          <code style={{ background: '#f0f0f0', padding: '4px 8px', borderRadius: '4px' }}>
            cd backend && npm run dev
          </code>
        </p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      {/* ===== NAVBAR ===== */}
      <nav style={{
        ...styles.navbar,
        background: isScrolled ? 'white' : 'transparent',
        boxShadow: isScrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
        padding: isScrolled ? '15px 0' : '20px 0'
      }}>
        <div style={styles.navContainer}>
          <div style={styles.logo}>
            <span style={{ fontSize: '30px' }}>🍔</span>
            <span style={{ fontWeight: 700, fontSize: '24px' }}>
              Food<span style={{ color: '#ff6b35' }}>Express</span>
            </span>
          </div>

          <div style={{
            ...styles.navLinks,
            display: mobileMenu ? 'flex' : 'flex'
          }}>
            <a href="#home" style={styles.navLink}>Home</a>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#popular" style={styles.navLink}>Menu</a>
            {user && (
              <a href="#orders" style={styles.navLink} onClick={() => {
                fetchOrders();
                setShowOrderModal(true);
              }}>My Orders</a>
            )}
          </div>

          <div style={styles.navActions}>
            <button style={styles.cartBtn} onClick={() => setShowOrderModal(true)}>
              🛒
              {cartCount > 0 && (
                <span style={styles.cartBadge}>{cartCount}</span>
              )}
            </button>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  👤 {user.username}
                </span>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                  Logout
                </button>
              </div>
            ) : (
              <button style={styles.signInBtn} onClick={() => setShowLogin(true)}>
                Sign In
              </button>
            )}
            <button 
              style={styles.mobileToggle}
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? '✕' : '☰'}
            </button>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section id="home" style={styles.hero}>
        <div style={styles.container}>
          <div style={styles.heroContent}>
            <div style={styles.heroText}>
              <div style={styles.heroBadge}>
                <span style={{ fontSize: '20px' }}>🚀</span>
                <span>Order food now!</span>
              </div>
              <h1 style={styles.heroTitle}>
                <span style={styles.highlight}>Delicious</span> Food,<br />
                <span style={styles.highlight}>Delivered</span> Fast
              </h1>
              <p style={styles.heroDescription}>
                Craving something delicious? Order from the best restaurants in town
                and get your food delivered to your doorstep in minutes.
              </p>
              <div style={styles.heroButtons}>
                <button style={styles.primaryBtn} onClick={() => {
                  document.getElementById('popular').scrollIntoView({ behavior: 'smooth' });
                }}>
                  Order Now →
                </button>
                <button style={styles.outlineBtn} onClick={() => {
                  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
                }}>
                  Learn More
                </button>
              </div>
              <div style={styles.heroStats}>
                <div style={styles.stat}>
                  <span style={styles.statNumber}>{foods.length * 1000}+</span>
                  <span style={styles.statLabel}>Happy Customers</span>
                </div>
                <div style={styles.statDivider}></div>
                <div style={styles.stat}>
                  <span style={styles.statNumber}>{foods.length * 5}+</span>
                  <span style={styles.statLabel}>Restaurants</span>
                </div>
                <div style={styles.statDivider}></div>
                <div style={styles.stat}>
                  <span style={styles.statNumber}>98%</span>
                  <span style={styles.statLabel}>Satisfaction</span>
                </div>
              </div>
            </div>
            <div style={styles.heroImage}>
              <div style={styles.imageWrapper}>
                <div style={styles.foodCircle}>
                  <span style={styles.foodEmoji}>🍕</span>
                  <span style={{...styles.foodEmoji, animationDelay: '0.5s'}}>🍔</span>
                  <span style={{...styles.foodEmoji, animationDelay: '1s'}}>🍣</span>
                  <span style={{...styles.foodEmoji, animationDelay: '1.5s'}}>🍝</span>
                </div>
                <div style={{...styles.floatingCard, top: 0, right: 0, animationDelay: '0s'}}>
                  <span>🌮</span> Tacos
                </div>
                <div style={{...styles.floatingCard, bottom: '20px', left: '-30px', animationDelay: '1s'}}>
                  <span>🥗</span> Salad
                </div>
                <div style={{...styles.floatingCard, bottom: '80px', right: '-20px', animationDelay: '2s'}}>
                  <span>🍰</span> Dessert
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" style={styles.features}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Why Choose Us?</h2>
          <p style={styles.sectionSubtitle}>We make ordering food easy, fast, and enjoyable</p>
          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚀</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Fast Delivery</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>Get your food delivered in 30 minutes or less</p>
            </div>
            <div style={styles.featureCard}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🍽️</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Top Restaurants</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>Curated selection of the best local restaurants</p>
            </div>
            <div style={styles.featureCard}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💰</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Best Prices</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>Competitive prices and exclusive deals</p>
            </div>
            <div style={styles.featureCard}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Secure Payment</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>Safe and secure payment methods</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== POPULAR FOODS SECTION ===== */}
      <section id="popular" style={styles.popularFoods}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Popular Foods</h2>
          <p style={styles.sectionSubtitle}>Discover our most loved dishes by our customers</p>
          <div style={styles.foodsGrid}>
            {foods.map((food) => (
              <div 
                key={food.id}
                style={{
                  ...styles.foodCard,
                  transform: hoveredFood === food.id ? 'translateY(-8px)' : 'none',
                  boxShadow: hoveredFood === food.id ? '0 15px 40px rgba(0,0,0,0.12)' : '0 5px 20px rgba(0,0,0,0.06)'
                }}
                onMouseEnter={() => setHoveredFood(food.id)}
                onMouseLeave={() => setHoveredFood(null)}
              >
                <div style={{ fontSize: '4rem', marginBottom: '15px' }}>{food.emoji || '🍽️'}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>{food.name}</h3>
                <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '12px' }}>{food.description}</p>
                {renderStars(food.rating || 4.5)}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ff6b35' }}>
                    ${food.price}
                  </span>
                  <button 
                    style={styles.orderBtn}
                    onClick={() => addToCart(food)}
                  >
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section style={styles.cta}>
        <div style={styles.container}>
          <div style={styles.ctaContent}>
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', marginBottom: '15px' }}>
                Ready to order?
              </h2>
              <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.9)', marginBottom: '25px' }}>
                {user ? 'Start adding items to your cart now!' : 'Sign in to start ordering your favorite food!'}
              </p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {user ? (
                  <button style={styles.appStoreBtn} onClick={() => {
                    document.getElementById('popular').scrollIntoView({ behavior: 'smooth' });
                  }}>
                    🛒 Browse Menu
                  </button>
                ) : (
                  <button style={styles.appStoreBtn} onClick={() => setShowLogin(true)}>
                    🔑 Sign In to Order
                  </button>
                )}
              </div>
            </div>
            <div style={{ fontSize: '6rem', opacity: 0.8 }}>📱</div>
          </div>
        </div>
      </section>

      {/* ===== LOGIN/REGISTER MODAL ===== */}
      {showLogin && (
        <div style={styles.modalOverlay} onClick={() => setShowLogin(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowLogin(false)}>✕</button>
            <h2 style={{ marginBottom: '20px' }}>Welcome to FoodExpress</h2>
            
            {authError && (
              <div style={styles.authError}>{authError}</div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} style={styles.authForm}>
              <h3 style={{ marginBottom: '10px' }}>Login</h3>
              <input
                type="email"
                placeholder="Email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                style={styles.authInput}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                style={styles.authInput}
                required
              />
              <button type="submit" style={styles.authSubmitBtn}>Login</button>
            </form>

            <div style={{ textAlign: 'center', margin: '15px 0' }}>OR</div>

            {/* Register Form */}
            <form onSubmit={handleRegister} style={styles.authForm}>
              <h3 style={{ marginBottom: '10px' }}>Create Account</h3>
              <input
                type="text"
                placeholder="Username"
                value={registerData.username}
                onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                style={styles.authInput}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                style={styles.authInput}
                required
              />
              <input
                type="password"
                placeholder="Password (min 6 chars)"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                style={styles.authInput}
                required
                minLength="6"
              />
              <input
                type="text"
                placeholder="Phone"
                value={registerData.phone}
                onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                style={styles.authInput}
              />
              <input
                type="text"
                placeholder="Delivery Address"
                value={registerData.address}
                onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                style={styles.authInput}
              />
              <button type="submit" style={styles.authSubmitBtn}>Register</button>
            </form>
          </div>
        </div>
      )}

      {/* ===== CART/ORDER MODAL ===== */}
      {showOrderModal && (
        <div style={styles.modalOverlay} onClick={() => setShowOrderModal(false)}>
          <div style={{...styles.modal, maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowOrderModal(false)}>✕</button>
            <h2 style={{ marginBottom: '20px' }}>🛒 Your Cart</h2>
            
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ fontSize: '3rem' }}>🛒</p>
                <p style={{ color: '#666' }}>Your cart is empty</p>
                <button 
                  style={styles.primaryBtn}
                  onClick={() => setShowOrderModal(false)}
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} style={styles.cartItem}>
                    <span style={{ fontSize: '2rem' }}>{item.emoji || '🍽️'}</span>
                    <div style={{ flex: 1 }}>
                      <h4>{item.name}</h4>
                      <span style={{ color: '#666' }}>${item.price} x {item.quantity}</span>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#ff6b35' }}>
                      ${(parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2)}
                    </span>
                    <button 
                      style={styles.removeBtn}
                      onClick={() => {
                        const newCart = cart.filter(c => c.id !== item.id);
                        setCart(newCart);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div style={styles.cartTotal}>
                  <span>Total:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff6b35' }}>
                    ${cartTotal}
                  </span>
                </div>
                <button 
                  style={{...styles.primaryBtn, width: '100%', marginTop: '15px'}}
                  onClick={placeOrder}
                >
                  Place Order
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// STYLES
// ============================================
const styles = {
  app: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    overflowX: 'hidden',
    background: '#fafafa',
    color: '#2d2d2d'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #fff5f0, #ffe8e0)'
  },
  loadingSpinner: {
    fontSize: '4rem',
    animation: 'pulse 1.5s ease-in-out infinite'
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px',
    textAlign: 'center'
  },
  
  // Navbar
  navbar: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    transition: 'all 0.3s ease',
    padding: '20px 0'
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer'
  },
  navLinks: {
    display: 'flex',
    gap: '30px',
    alignItems: 'center'
  },
  navLink: {
    textDecoration: 'none',
    color: '#2d2d2d',
    fontWeight: 500,
    transition: 'color 0.3s',
    cursor: 'pointer'
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  cartBtn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    fontSize: '22px',
    cursor: 'pointer',
    color: '#2d2d2d'
  },
  cartBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: '#ff6b35',
    color: 'white',
    fontSize: '11px',
    padding: '2px 7px',
    borderRadius: '50%',
    minWidth: '18px'
  },
  signInBtn: {
    padding: '10px 24px',
    background: '#ff6b35',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  logoutBtn: {
    padding: '8px 16px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s'
  },
  mobileToggle: {
    display: 'none',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#2d2d2d'
  },

  // Hero
  hero: {
    padding: '140px 0 80px',
    background: 'linear-gradient(135deg, #fff5f0 0%, #ffe8e0 100%)',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center'
  },
  heroContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '60px',
    alignItems: 'center'
  },
  heroText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '25px'
  },
  heroBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    background: 'white',
    padding: '8px 20px',
    borderRadius: '50px',
    width: 'fit-content',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  heroTitle: {
    fontSize: '4rem',
    fontWeight: 800,
    lineHeight: 1.1,
    margin: 0
  },
  highlight: {
    background: 'linear-gradient(135deg, #ff6b35, #ff8c5a)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  heroDescription: {
    fontSize: '1.15rem',
    color: '#666',
    lineHeight: 1.8,
    maxWidth: '500px'
  },
  heroButtons: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap'
  },
  primaryBtn: {
    padding: '14px 32px',
    background: '#ff6b35',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  outlineBtn: {
    padding: '14px 32px',
    background: 'transparent',
    color: '#ff6b35',
    border: '2px solid #ff6b35',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s'
  },
  heroStats: {
    display: 'flex',
    alignItems: 'center',
    gap: '30px',
    padding: '20px 0'
  },
  stat: {
    display: 'flex',
    flexDirection: 'column'
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 700
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#888'
  },
  statDivider: {
    width: '2px',
    height: '40px',
    background: '#ddd'
  },
  heroImage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  imageWrapper: {
    position: 'relative',
    width: '450px',
    height: '450px'
  },
  foodCircle: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #ff6b35, #ff8c5a)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '30px',
    padding: '60px',
    animation: 'pulse 2s ease-in-out infinite',
    boxShadow: '0 20px 60px rgba(255, 107, 53, 0.3)'
  },
  foodEmoji: {
    fontSize: '4rem',
    animation: 'float 3s ease-in-out infinite'
  },
  floatingCard: {
    position: 'absolute',
    background: 'white',
    padding: '12px 20px',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 600,
    animation: 'float 3s ease-in-out infinite'
  },

  // Features
  features: {
    padding: '80px 0',
    background: 'white'
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '30px'
  },
  featureCard: {
    background: '#f5f5f5',
    padding: '35px 25px',
    borderRadius: '16px',
    textAlign: 'center',
    transition: 'all 0.3s',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'default'
  },

  // Popular Foods
  popularFoods: {
    padding: '80px 0',
    background: 'white'
  },
  foodsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '30px'
  },
  foodCard: {
    background: '#f9f9f9',
    padding: '25px',
    borderRadius: '16px',
    textAlign: 'center',
    transition: 'all 0.3s',
    cursor: 'default'
  },
  orderBtn: {
    padding: '8px 20px',
    background: '#ff6b35',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s'
  },

  // CTA
  cta: {
    padding: '80px 0',
    background: 'linear-gradient(135deg, #ff6b35, #ff8c5a)'
  },
  ctaContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  appStoreBtn: {
    padding: '12px 28px',
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: '2px solid white',
    borderRadius: '50px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s'
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 2000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px'
  },
  modal: {
    background: 'white',
    padding: '40px',
    borderRadius: '16px',
    maxWidth: '450px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative'
  },
  modalClose: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999'
  },
  authError: {
    background: '#fee',
    color: '#dc3545',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  authForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  authInput: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px'
  },
  authSubmitBtn: {
    padding: '12px',
    background: '#ff6b35',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px 0',
    borderBottom: '1px solid #eee'
  },
  cartTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '15px 0',
    fontSize: '1.2rem',
    fontWeight: 'bold'
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#dc3545',
    fontSize: '18px',
    cursor: 'pointer'
  },

  // Section common
  sectionTitle: {
    textAlign: 'center',
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '15px'
  },
  sectionSubtitle: {
    textAlign: 'center',
    fontSize: '1.1rem',
    color: '#777',
    marginBottom: '50px'
  }
};

// ============================================
// GLOBAL STYLES (Injected via style tag)
// ============================================
const globalStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }

  @media (max-width: 992px) {
    .mobile-toggle { display: block !important; }
    .nav-links { display: none !important; }
    .hero-content { grid-template-columns: 1fr !important; gap: 40px !important; }
    .hero-text { order: 2 !important; }
    .hero-image { order: 1 !important; }
    .hero-title { font-size: 3rem !important; }
    .features-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .foods-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .image-wrapper { width: 350px !important; height: 350px !important; }
    .food-emoji { font-size: 3rem !important; }
    .floating-card { display: none !important; }
  }

  @media (max-width: 576px) {
    .features-grid { grid-template-columns: 1fr !important; }
    .foods-grid { grid-template-columns: 1fr !important; }
    .image-wrapper { width: 280px !important; height: 280px !important; }
    .food-emoji { font-size: 2.5rem !important; }
    .hero-stats { flex-wrap: wrap !important; gap: 15px !important; }
    .stat-divider { display: none !important; }
    .cta-content { flex-direction: column !important; text-align: center !important; }
  }

  .mobile-toggle {
    display: none !important;
  }
  
  @media (max-width: 992px) {
    .mobile-toggle {
      display: block !important;
    }
    .nav-links {
      display: none !important;
      position: absolute !important;
      top: 100% !important;
      left: 0 !important;
      right: 0 !important;
      background: white !important;
      flex-direction: column !important;
      padding: 30px !important;
      gap: 20px !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
    }
    .nav-links.active {
      display: flex !important;
    }
  }
`;

const styleTag = document.createElement('style');
styleTag.textContent = globalStyles;
document.head.appendChild(styleTag);

export default App;