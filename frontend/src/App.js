// ============================================
// Food Delivery App - Complete Frontend
// Features: Multi-hotel browsing, ordering, commission system
// ============================================
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API Configuration
const API_URL = 'http://localhost:5000/api';

function App() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [hoveredHotel, setHoveredHotel] = useState(null);
  const [hoveredFood, setHoveredFood] = useState(null);
  
  // Data states
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Auth states
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showLogin, setShowLogin] = useState(false);
  const [authError, setAuthError] = useState('');
  
  // Cart states
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  
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
    address: '',
    role: 'user'
  });

  // ============================================
  // EFFECTS
  // ============================================
  
  // Fetch hotels on component mount
  useEffect(() => {
    fetchHotels();
    if (token) {
      fetchUserProfile();
      fetchUserOrders();
    }
  }, []);

  // Scroll handler for navbar
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

  // Fetch all hotels
  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/hotels`);
      setHotels(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching hotels:', err);
      setError('Failed to load hotels. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch hotel menu
  const fetchHotelMenu = async (hotelId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/hotels/${hotelId}/menu`);
      setMenuItems(response.data);
      setError('');
    } catch (err) {
      console.error('Error fetching menu:', err);
      setError('Failed to load menu');
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
      setUser(response.data.user);
    } catch (err) {
      console.error('Error fetching profile:', err);
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  // Fetch user orders
  const fetchUserOrders = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  // ============================================
  // AUTH FUNCTIONS
  // ============================================

  // Register user
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await axios.post(`${API_URL}/auth/register`, registerData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      setShowLogin(false);
      setRegisterData({ username: '', email: '', password: '', phone: '', address: '', role: 'user' });
      alert(user.role === 'manager' 
        ? 'Registration successful! Awaiting admin approval.' 
        : 'Welcome! Account created successfully.');
    } catch (err) {
      console.error('Registration error:', err);
      setAuthError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  // Login user
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await axios.post(`${API_URL}/auth/login`, loginData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      setShowLogin(false);
      setLoginData({ email: '', password: '' });
      fetchUserOrders();
      alert(`Welcome back, ${user.username}!`);
    } catch (err) {
      console.error('Login error:', err);
      setAuthError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCart([]);
    setOrders([]);
  };

  // ============================================
  // CART FUNCTIONS
  // ============================================

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
  };

  // Remove from cart
  const removeFromCart = (foodId) => {
    setCart(cart.filter(item => item.id !== foodId));
  };

  // Update quantity
  const updateQuantity = (foodId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(foodId);
    } else {
      setCart(cart.map(item => 
        item.id === foodId ? { ...item, quantity } : item
      ));
    }
  };

  // Calculate cart total
  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
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

    if (!selectedHotel) {
      alert('Please select a hotel first');
      return;
    }

    try {
      const orderData = {
        hotel_id: selectedHotel.id,
        items: cart.map(item => ({
          food_id: item.id,
          name: item.name,
          price: parseFloat(item.price),
          quantity: item.quantity
        })),
        delivery_address: user.address || 'Please update your address in profile',
        delivery_instructions: '',
        payment_method: 'simulated'
      };

      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`Order placed successfully! Order #${response.data.order?.order_number || ''}\n\nHotel: ${selectedHotel.name}\nTotal: $${getCartTotal().toFixed(2)}\n\nPayment will be processed by admin.`);
      setCart([]);
      setShowCart(false);
      fetchUserOrders();
    } catch (err) {
      console.error('Error placing order:', err);
      alert('Failed to place order: ' + (err.response?.data?.error || 'Unknown error'));
    }
  };

  // ============================================
  // HOTEL FUNCTIONS
  // ============================================

  // Select a hotel
  const selectHotel = async (hotel) => {
    setSelectedHotel(hotel);
    await fetchHotelMenu(hotel.id);
    // Scroll to menu section
    document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Go back to hotels list
  const goBackToHotels = () => {
    setSelectedHotel(null);
    setMenuItems([]);
  };

  // ============================================
  // RENDER HELPERS
  // ============================================

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} style={{ 
            color: i <= Math.round(rating || 0) ? '#ffc107' : '#ddd',
            fontSize: '14px'
          }}>★</span>
        ))}
      </div>
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // ============================================
  // RENDER
  // ============================================

  if (loading && hotels.length === 0) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>🍔</div>
        <h2>Loading delicious food...</h2>
        <p>Please wait while we prepare your menu</p>
      </div>
    );
  }

  if (error && hotels.length === 0) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={{ color: '#ff6b35' }}>⚠️ {error}</h2>
        <button onClick={fetchHotels} style={styles.primaryBtn}>Retry</button>
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
          <div style={styles.logo} onClick={() => { goBackToHotels(); window.scrollTo(0, 0); }}>
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
            <a href="#hotels" style={styles.navLink}>Hotels</a>
            {user && (
              <a href="#" style={styles.navLink} onClick={(e) => {
                e.preventDefault();
                fetchUserOrders();
                setShowOrders(!showOrders);
              }}>My Orders</a>
            )}
          </div>

          <div style={styles.navActions}>
            {/* Cart Button */}
            <button style={styles.cartBtn} onClick={() => setShowCart(!showCart)}>
              🛒
              {cartCount > 0 && (
                <span style={styles.cartBadge}>{cartCount}</span>
              )}
            </button>

            {/* User Info */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>
                  👤 {user.username}
                  {user.role === 'manager' && ' (Manager)'}
                  {user.role === 'admin' && ' (Admin)'}
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
                <span>Order from your favorite hotels!</span>
              </div>
              <h1 style={styles.heroTitle}>
                <span style={styles.highlight}>Delicious</span> Food,<br />
                <span style={styles.highlight}>Delivered</span> Fast
              </h1>
              <p style={styles.heroDescription}>
                Browse through top hotels in your area. From TIME HOTEL to SANFORD,
                we've got the best selection of cuisines just for you.
              </p>
              <div style={styles.heroButtons}>
                <button style={styles.primaryBtn} onClick={() => {
                  document.getElementById('hotels').scrollIntoView({ behavior: 'smooth' });
                }}>
                  Browse Hotels →
                </button>
                <button style={styles.outlineBtn} onClick={() => {
                  document.getElementById('features').scrollIntoView({ behavior: 'smooth' });
                }}>
                  Learn More
                </button>
              </div>
              <div style={styles.heroStats}>
                <div style={styles.stat}>
                  <span style={styles.statNumber}>{hotels.length}+</span>
                  <span style={styles.statLabel}>Hotels</span>
                </div>
                <div style={styles.statDivider}></div>
                <div style={styles.stat}>
                  <span style={styles.statNumber}>98%</span>
                  <span style={styles.statLabel}>Satisfaction</span>
                </div>
                <div style={styles.statDivider}></div>
                <div style={styles.stat}>
                  <span style={styles.statNumber}>10%</span>
                  <span style={styles.statLabel}>Commission</span>
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
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏨</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Top Hotels</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>Curated selection of the best local hotels</p>
            </div>
            <div style={styles.featureCard}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💰</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Commission System</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>10% admin commission, fair for everyone</p>
            </div>
            <div style={styles.featureCard}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔒</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Secure Payment</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>Safe and secure payment methods</p>
            </div>
            <div style={styles.featureCard}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🚀</div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Fast Delivery</h3>
              <p style={{ color: '#666', lineHeight: 1.6 }}>Get your food delivered in 30 minutes or less</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOTELS SECTION ===== */}
      <section id="hotels" style={styles.hotelsSection}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Our Hotels</h2>
          <p style={styles.sectionSubtitle}>Choose from the best hotels in town</p>
          
          {selectedHotel ? (
            // Hotel Menu View
            <div>
              <div style={styles.hotelHeader}>
                <button onClick={goBackToHotels} style={styles.backBtn}>← Back to Hotels</button>
                <div style={styles.hotelInfo}>
                  <h2>{selectedHotel.name}</h2>
                  <p>{selectedHotel.description}</p>
                  <div style={styles.hotelMeta}>
                    <span>⭐ {selectedHotel.rating || 4.5}</span>
                    <span>🍽️ {selectedHotel.cuisine_type || 'Various'}</span>
                    <span>📍 {selectedHotel.address}</span>
                  </div>
                </div>
              </div>
              
              <div id="menu-section" style={styles.menuGrid}>
                {menuItems.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    No menu items available for this hotel
                  </p>
                ) : (
                  menuItems.map((food) => (
                    <div 
                      key={food.id}
                      style={{
                        ...styles.foodCard,
                        transform: hoveredFood === food.id ? 'translateY(-5px)' : 'none'
                      }}
                      onMouseEnter={() => setHoveredFood(food.id)}
                      onMouseLeave={() => setHoveredFood(null)}
                    >
                      <div style={{ fontSize: '3rem' }}>{food.emoji || '🍽️'}</div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '10px 0 5px' }}>{food.name}</h4>
                      <p style={{ color: '#666', fontSize: '0.85rem' }}>{food.description}</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#ff6b35', margin: '10px 0' }}>
                        ${food.price}
                      </p>
                      <button 
                        style={styles.addBtn}
                        onClick={() => addToCart(food)}
                      >
                        Add to Cart
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Hotels Grid View
            <div style={styles.hotelsGrid}>
              {hotels.map((hotel) => (
                <div 
                  key={hotel.id}
                  style={{
                    ...styles.hotelCard,
                    transform: hoveredHotel === hotel.id ? 'translateY(-8px)' : 'none',
                    boxShadow: hoveredHotel === hotel.id ? '0 15px 40px rgba(0,0,0,0.12)' : '0 5px 20px rgba(0,0,0,0.06)'
                  }}
                  onMouseEnter={() => setHoveredHotel(hotel.id)}
                  onMouseLeave={() => setHoveredHotel(null)}
                  onClick={() => selectHotel(hotel)}
                >
                  <div style={{ fontSize: '4rem', marginBottom: '10px' }}>
                    {hotel.id === 1 && '🏨'}
                    {hotel.id === 2 && '🌍'}
                    {hotel.id === 3 && '🍗'}
                    {hotel.id === 4 && '🐔'}
                    {hotel.id === 5 && '🦞'}
                  </div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>{hotel.name}</h3>
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: '5px 0' }}>{hotel.description}</p>
                  <div style={styles.hotelMeta}>
                    <span>⭐ {hotel.rating || 4.5}</span>
                    <span>🍽️ {hotel.cuisine_type || 'Various'}</span>
                  </div>
                  <button style={styles.viewMenuBtn}>View Menu →</button>
                </div>
              ))}
            </div>
          )}
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
                {user ? 'Browse our hotels and start ordering now!' : 'Sign in to start ordering your favorite food!'}
              </p>
              <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                {user ? (
                  <button style={styles.appStoreBtn} onClick={() => {
                    document.getElementById('hotels').scrollIntoView({ behavior: 'smooth' });
                  }}>
                    🛒 Browse Hotels
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
              <select
                value={registerData.role}
                onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
                style={styles.authInput}
              >
                <option value="user">Customer</option>
                <option value="manager">Hotel Manager</option>
              </select>
              {registerData.role === 'manager' && (
                <input
                  type="text"
                  placeholder="Hotel Name"
                  onChange={(e) => setRegisterData({...registerData, hotel_name: e.target.value})}
                  style={styles.authInput}
                />
              )}
              <button type="submit" style={styles.authSubmitBtn}>Register</button>
            </form>
          </div>
        </div>
      )}

      {/* ===== CART MODAL ===== */}
      {showCart && (
        <div style={styles.modalOverlay} onClick={() => setShowCart(false)}>
          <div style={{...styles.modal, maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowCart(false)}>✕</button>
            <h2 style={{ marginBottom: '20px' }}>🛒 Your Cart</h2>
            
            {!selectedHotel && cart.length > 0 && (
              <p style={{ color: '#ff6b35', marginBottom: '10px' }}>
                ⚠️ Please select a hotel first before ordering
              </p>
            )}
            
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ fontSize: '3rem' }}>🛒</p>
                <p style={{ color: '#666' }}>Your cart is empty</p>
                <button 
                  style={styles.primaryBtn}
                  onClick={() => setShowCart(false)}
                >
                  Browse Hotels
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        style={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >-</button>
                      <span>{item.quantity}</span>
                      <button 
                        style={styles.qtyBtn}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >+</button>
                    </div>
                    <span style={{ fontWeight: 'bold', color: '#ff6b35', minWidth: '60px' }}>
                      ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </span>
                    <button 
                      style={styles.removeBtn}
                      onClick={() => removeFromCart(item.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div style={styles.cartTotal}>
                  <span>Total:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff6b35' }}>
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
                <button 
                  style={{...styles.primaryBtn, width: '100%', marginTop: '15px'}}
                  onClick={placeOrder}
                  disabled={!selectedHotel}
                >
                  {selectedHotel ? `Place Order (${selectedHotel.name})` : 'Select a Hotel First'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== ORDERS MODAL ===== */}
      {showOrders && (
        <div style={styles.modalOverlay} onClick={() => setShowOrders(false)}>
          <div style={{...styles.modal, maxWidth: '700px'}} onClick={(e) => e.stopPropagation()}>
            <button style={styles.modalClose} onClick={() => setShowOrders(false)}>✕</button>
            <h2 style={{ marginBottom: '20px' }}>📋 My Orders</h2>
            
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <p style={{ fontSize: '3rem' }}>📋</p>
                <p style={{ color: '#666' }}>No orders yet</p>
                <button 
                  style={styles.primaryBtn}
                  onClick={() => {
                    setShowOrders(false);
                    document.getElementById('hotels').scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Start Ordering
                </button>
              </div>
            ) : (
              <div>
                {orders.map((order) => (
                  <div key={order.id} style={styles.orderCard}>
                    <div style={styles.orderHeader}>
                      <span style={{ fontWeight: 'bold' }}>#{order.order_number}</span>
                      <span style={{ 
                        ...styles.orderStatus,
                        background: order.status === 'delivered' ? '#28a745' : 
                                   order.status === 'cancelled' ? '#dc3545' : '#ffc107'
                      }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={styles.orderDetails}>
                      <p><strong>Hotel:</strong> {order.hotel_name}</p>
                      <p><strong>Total:</strong> ${order.total_amount}</p>
                      <p><strong>Commission:</strong> ${order.commission}</p>
                      <p><strong>Date:</strong> {new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    {order.status === 'in_transit' && !order.is_delivery_confirmed && (
                      <button 
                        style={styles.confirmBtn}
                        onClick={async () => {
                          try {
                            await axios.put(`${API_URL}/orders/${order.id}/confirm`, {}, {
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            alert('Delivery confirmed! Payment will be processed to the hotel.');
                            fetchUserOrders();
                          } catch (err) {
                            alert('Failed to confirm delivery');
                          }
                        }}
                      >
                        Confirm Delivery
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <footer style={styles.footer}>
        <div style={styles.container}>
          <div style={styles.footerGrid}>
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>
                🍔 Food<span style={{ color: '#ff6b35' }}>Express</span>
              </h3>
              <p style={{ color: '#aaa', maxWidth: '300px' }}>
                Delivering happiness to your doorstep. Fresh, fast, and always delicious.
              </p>
            </div>
            <div>
              <h4 style={styles.footerTitle}>Hotels</h4>
              {hotels.map(h => (
                <a key={h.id} href="#" style={styles.footerLink} onClick={(e) => {
                  e.preventDefault();
                  selectHotel(h);
                }}>{h.name}</a>
              ))}
            </div>
            <div>
              <h4 style={styles.footerTitle}>Support</h4>
              <a href="#" style={styles.footerLink}>Help Center</a>
              <a href="#" style={styles.footerLink}>Terms of Service</a>
              <a href="#" style={styles.footerLink}>Privacy Policy</a>
            </div>
            <div>
              <h4 style={styles.footerTitle}>Contact</h4>
              <p style={{ color: '#aaa' }}>📧 support@foodexpress.com</p>
              <p style={{ color: '#aaa' }}>📞 +254 700 123456</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '24px' }}>🐦</span>
                <span style={{ fontSize: '24px' }}>📷</span>
                <span style={{ fontSize: '24px' }}>📘</span>
              </div>
            </div>
          </div>
          <div style={styles.footerBottom}>
            <p>© 2024 FoodExpress. All rights reserved. | 10% Admin Commission</p>
          </div>
        </div>
      </footer>
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

  // Hotels
  hotelsSection: {
    padding: '80px 0',
    background: 'white'
  },
  hotelsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '30px'
  },
  hotelCard: {
    background: '#f9f9f9',
    padding: '30px',
    borderRadius: '16px',
    textAlign: 'center',
    transition: 'all 0.3s',
    cursor: 'pointer',
    border: '2px solid transparent'
  },
  hotelInfo: {
    marginBottom: '20px'
  },
  hotelMeta: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    color: '#666',
    fontSize: '0.9rem',
    margin: '10px 0'
  },
  viewMenuBtn: {
    padding: '10px 24px',
    background: '#ff6b35',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s',
    marginTop: '15px'
  },
  hotelHeader: {
    marginBottom: '30px'
  },
  backBtn: {
    padding: '10px 20px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    marginBottom: '15px'
  },

  // Menu
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px'
  },
  foodCard: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    transition: 'all 0.3s'
  },
  addBtn: {
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

  // Cart
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
  qtyBtn: {
    padding: '4px 10px',
    background: '#f0f0f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#dc3545',
    fontSize: '18px',
    cursor: 'pointer'
  },

  // Orders
  orderCard: {
    background: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  orderHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  orderStatus: {
    padding: '4px 12px',
    borderRadius: '20px',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  orderDetails: {
    fontSize: '14px',
    color: '#555'
  },
  confirmBtn: {
    padding: '8px 16px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '10px'
  },

  // Footer
  footer: {
    background: '#1a1a1a',
    color: 'white',
    padding: '60px 0 20px'
  },
  footerGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    gap: '40px',
    marginBottom: '40px'
  },
  footerTitle: {
    fontSize: '1.1rem',
    marginBottom: '15px',
    color: 'white'
  },
  footerLink: {
    display: 'block',
    color: '#aaa',
    textDecoration: 'none',
    marginBottom: '10px',
    cursor: 'pointer',
    transition: 'color 0.3s'
  },
  footerBottom: {
    textAlign: 'center',
    paddingTop: '20px',
    borderTop: '1px solid #333',
    color: '#666'
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
// GLOBAL STYLES
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
    .hotels-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .menu-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .footer-grid { grid-template-columns: 1fr 1fr !important; }
    .image-wrapper { width: 350px !important; height: 350px !important; }
    .food-emoji { font-size: 3rem !important; }
    .floating-card { display: none !important; }
  }

  @media (max-width: 576px) {
    .features-grid { grid-template-columns: 1fr !important; }
    .hotels-grid { grid-template-columns: 1fr !important; }
    .menu-grid { grid-template-columns: 1fr !important; }
    .footer-grid { grid-template-columns: 1fr !important; }
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