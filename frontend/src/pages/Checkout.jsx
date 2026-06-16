import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import confetti from 'canvas-confetti';
import { Truck, CheckCircle2 } from 'lucide-react';
import { UniversalMap } from '../components/UniversalMap';
import { fetchAddresses, addAddress, fetchProfile } from '../services/api';

const handleNameChange = (e, setFieldValue) => {
  const value = e.target.value;
  const clean = value.replace(/[^A-Za-z\s]/g, '');
  setFieldValue('name', clean);
};

const handlePhoneChange = (e, setFieldValue) => {
  const value = e.target.value;
  const clean = value.replace(/\D/g, '').substring(0, 10);
  setFieldValue('phone', clean);
};

const handleCardNumChange = (e, setFieldValue) => {
  const value = e.target.value;
  const clean = value.replace(/\D/g, '').substring(0, 16);
  const formatted = clean.match(/.{1,4}/g)?.join(' ') || '';
  setFieldValue('cardNum', formatted);
};

const handleExpiryChange = (e, setFieldValue) => {
  const value = e.target.value;
  const clean = value.replace(/\D/g, '').substring(0, 4);
  let formatted = '';
  if (clean.length > 0) {
    if (clean.length <= 2) {
      formatted = clean;
    } else {
      formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
    }
  }
  setFieldValue('expiry', formatted);
};

const handleCVVChange = (e, setFieldValue) => {
  const value = e.target.value;
  const clean = value.replace(/\D/g, '').substring(0, 3);
  setFieldValue('cvv', clean);
};

const luhnCheck = (val) => {
  if (!val) return false;
  const clean = val.replace(/\s/g, '');
  if (clean.length !== 16) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
};

const expiryCheck = (val) => {
  if (!val) return false;
  const parts = val.split('/');
  if (parts.length !== 2) return false;
  const month = parseInt(parts[0], 10);
  const year = parseInt('20' + parts[1], 10);
  if (month < 1 || month > 12) return false;
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
};

const upiCheck = (val) => {
  if (!val) return false;
  const upiRegex = /^[a-zA-Z0-9.-]+@[a-zA-Z0-9.-]+$/;
  return upiRegex.test(val);
};

const CheckoutSchema = Yup.object().shape({
  name: Yup.string().required('Full Name is required'),
  phone: Yup.string().matches(/^[0-9]{10}$/, 'Must be a 10 digit number').required('Phone is required'),
  address: Yup.string().required('Delivery address is required'),
  paymentMethod: Yup.string().required('Select a payment method'),
  cardNum: Yup.string().when('paymentMethod', {
    is: 'card',
    then: () => Yup.string()
      .required('Card number is required')
      .test('luhn', 'Invalid card number (failed Luhn algorithm check)', luhnCheck)
  }),
  expiry: Yup.string().when('paymentMethod', {
    is: 'card',
    then: () => Yup.string()
      .required('Expiry date is required')
      .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, 'Must be MM/YY')
      .test('future-expiry', 'Card is expired or date is invalid', expiryCheck)
  }),
  cvv: Yup.string().when('paymentMethod', {
    is: 'card',
    then: () => Yup.string().matches(/^[0-9]{3}$/, 'Must be exactly 3 digits').required('CVV is required')
  }),
  upiId: Yup.string().when('paymentMethod', {
    is: 'upi',
    then: () => Yup.string().required('UPI ID is required').test('upi-format', 'Invalid UPI ID format (user@bank)', upiCheck)
  })
});

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function Checkout() {
  const navigate = useNavigate();
  const { cartItems, activeRestaurant, cartTotal, clearCart } = useCart();

  const [coords, setCoords] = useState([28.6139, 77.2090]);
  const [step, setStep] = useState(1);
  const [orderId, setOrderId] = useState(null);
  const [gatewayMsg, setGatewayMsg] = useState('');
  const [status, setStatus] = useState('');
  const [riderCoords, setRiderCoords] = useState(null);

  const eventSource = useRef(null);
  const [mockPaymentState, setMockPaymentState] = useState(null);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const userStr = localStorage.getItem('z_user');
  const user = userStr ? JSON.parse(userStr) : null;
  const [profile, setProfile] = useState(user);

  const [cardBrand, setCardBrand] = useState('unknown');
  const [cardValid, setCardValid] = useState(null);
  const [expiryValid, setExpiryValid] = useState(null);
  const [cvvValid, setCvvValid] = useState(null);

  const [upiValid, setUpiValid] = useState(null);
  const [upiAuthStatus, setUpiAuthStatus] = useState('idle'); // 'idle' | 'checking' | 'verified' | 'failed'
  const upiTimeoutRef = useRef(null);

  const getCardBrand = (number) => {
    const clean = number.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    if (/^(508[5-9]|6521|60[6-8])/.test(clean)) return 'rupay';
    return 'unknown';
  };

  const validateCardNumber = (number) => {
    const clean = number.replace(/\D/g, '');
    const brand = getCardBrand(clean);
    setCardBrand(brand);
    if (clean.length === 16) {
      const isValid = luhnCheck(clean);
      setCardValid(isValid);
      return isValid;
    } else {
      setCardValid(false);
      return false;
    }
  };

  const validateExpiry = (exp) => {
    const isValid = expiryCheck(exp);
    setExpiryValid(isValid);
    return isValid;
  };

  const validateCVV = (cvv) => {
    const isValid = /^[0-9]{3}$/.test(cvv);
    setCvvValid(isValid);
    return isValid;
  };

  const validateUPI = (val) => {
    if (upiTimeoutRef.current) clearTimeout(upiTimeoutRef.current);
    
    const isFormatValid = upiCheck(val);
    if (!isFormatValid) {
      setUpiValid(false);
      setUpiAuthStatus('failed');
      return;
    }
    
    setUpiValid(null);
    setUpiAuthStatus('checking');
    
    upiTimeoutRef.current = setTimeout(() => {
      setUpiValid(true);
      setUpiAuthStatus('verified');
    }, 500);
  };

  useEffect(() => {
    if (user) {
      fetchAddresses().then(data => {
        if (Array.isArray(data)) setSavedAddresses(data);
      }).catch(err => console.error("Error loading addresses:", err));

      fetchProfile().then(data => {
        setProfile(data);
        localStorage.setItem('z_user', JSON.stringify(data));
      }).catch(err => console.error("Error loading profile:", err));
    }
  }, []);

  const handleVerifyMockUPI = async (upiPin) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    setGatewayMsg('Verifying UPI PIN...');
    setStep(2);
    try {
      await new Promise(r => setTimeout(r, 1200));

      const confirmRes = await fetch(`${API_URL}/api/orders/verify-razorpay-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ razorpayOrderId: 'mock', orderId: mockPaymentState.orderId })
      });
      const confirmData = await confirmRes.json();

      if (confirmData.success) {
        setOrderId(mockPaymentState.orderId);
        setMockPaymentState(null);
        setStep(3);
        clearCart();
        startTracking(mockPaymentState.orderId);
        confetti({ particleCount: 80, spread: 60 });
      } else {
        alert('Mock payment verification failed');
        setMockPaymentState(null);
        setStep(1);
      }
    } catch (e) {
      alert('Mock payment verification failed');
      setMockPaymentState(null);
      setStep(1);
    }
  };

  const handleVerifyMockCard = async (otp) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    setGatewayMsg('Confirming payment...');
    setStep(2);
    try {
      await new Promise(r => setTimeout(r, 1200));

      const confirmRes = await fetch(`${API_URL}/api/orders/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'mock', orderId: mockPaymentState.orderId, otp })
      });
      const confirmData = await confirmRes.json();

      if (confirmData.success) {
        setOrderId(mockPaymentState.orderId);
        setMockPaymentState(null);
        setStep(3);
        clearCart();
        startTracking(mockPaymentState.orderId);
        confetti({ particleCount: 80, spread: 60 });
        return true;
      } else {
        alert(confirmData.error || 'Mock payment confirmation failed');
        setStep(1);
        return false;
      }
    } catch (e) {
      alert('Mock payment confirmation failed');
      setStep(1);
      return false;
    }
  };

  const handlePlaceOrder = async (values) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    if (values.saveAddress && user) {
      try {
        await addAddress(values.address, coords[0], coords[1]);
      } catch (err) {
        console.error('Failed to save address:', err);
      }
    }

    const headers = { 'Content-Type': 'application/json' };
    if (user) {
      headers['x-user-id'] = user.id.toString();
    }

    if (values.paymentMethod === 'COD') {
      try {
        const response = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            items: cartItems,
            total_price: cartTotal + 40,
            address: values.address,
            latitude: coords[0],
            longitude: coords[1],
            payment_method: 'COD',
            payment_status: 'Pending',
            customer_name: values.name,
            customer_phone: values.phone
          }),
        });

        const order = await response.json();
        setOrderId(order.id);
        setStep(3);
        clearCart();
        startTracking(order.id);
        confetti({ particleCount: 80, spread: 60 });
      } catch (e) {
        alert('Order checkout failed');
        setStep(1);
      }
    } else if (values.paymentMethod === 'wallet') {
      try {
        setStep(2);
        setGatewayMsg('Deducting from your Zomato Wallet...');
        const response = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            items: cartItems,
            total_price: cartTotal + 40,
            address: values.address,
            latitude: coords[0],
            longitude: coords[1],
            payment_method: 'wallet',
            payment_status: 'Paid',
            customer_name: values.name,
            customer_phone: values.phone
          }),
        });

        const order = await response.json();
        if (!response.ok) {
          throw new Error(order.error || 'Wallet payment failed');
        }

        const updatedProfile = await fetchProfile();
        setProfile(updatedProfile);
        localStorage.setItem('z_user', JSON.stringify(updatedProfile));

        setOrderId(order.id);
        setStep(3);
        clearCart();
        startTracking(order.id);
        confetti({ particleCount: 80, spread: 60 });
      } catch (e) {
        alert(e.message || 'Wallet payment failed');
        setStep(1);
      }
    } else if (values.paymentMethod === 'upi') {
      try {
        setStep(2);
        setGatewayMsg('Initializing UPI payment with Razorpay...');

        const response = await fetch(`${API_URL}/api/orders/create-razorpay-order`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            items: cartItems,
            total_price: cartTotal + 40,
            address: values.address,
            latitude: coords[0],
            longitude: coords[1],
            customer_name: values.name,
            customer_phone: values.phone
          })
        });
        
        const data = await response.json();

        if (data.mockRedirect) {
          setMockPaymentState({
            type: 'upi',
            orderId: data.orderId,
            amount: cartTotal + 40,
            name: values.name,
            phone: values.phone,
            upiId: values.upiId
          });
          return;
        } else if (data.success) {
          setGatewayMsg('Loading payment overlay...');
          const scriptLoaded = await loadRazorpayScript();
          if (!scriptLoaded) {
            alert('Failed to load payment gateway script');
            setStep(1);
            return;
          }

          const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            name: 'Zomato Clone',
            description: `Order Receipt #${data.orderId}`,
            order_id: data.razorpayOrderId,
            handler: async function (res) {
              setStep(2);
              setGatewayMsg('Verifying payment signature...');
              try {
                const verifyRes = await fetch(`${API_URL}/api/orders/verify-razorpay-payment`, {
                  method: 'POST',
                  headers: headers,
                  body: JSON.stringify({
                    razorpayOrderId: res.razorpay_order_id,
                    razorpayPaymentId: res.razorpay_payment_id,
                    razorpaySignature: res.razorpay_signature,
                    orderId: data.orderId
                  })
                });
                const verifyData = await verifyRes.json();
                if (verifyData.success) {
                  setOrderId(data.orderId);
                  setStep(3);
                  clearCart();
                  startTracking(data.orderId);
                  confetti({ particleCount: 100, spread: 70 });
                } else {
                  alert('Payment verification failed.');
                  setStep(1);
                }
              } catch (e) {
                alert('Payment verification connection failed.');
                setStep(1);
              }
            },
            prefill: {
              name: values.name,
              contact: values.phone
            },
            theme: {
              color: '#e23744'
            },
            modal: {
              ondismiss: function () {
                alert('Payment cancelled by user.');
                setStep(1);
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        } else {
          throw new Error('Invalid Razorpay session response');
        }
      } catch (e) {
        alert('UPI Payment initialization failed: ' + e.message);
        setStep(1);
      }
    } else {
      try {
        setStep(2);
        setGatewayMsg('Initializing secure Card checkout with Stripe...');

        const response = await fetch(`${API_URL}/api/orders/create-checkout-session`, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            items: cartItems,
            total_price: cartTotal + 40,
            address: values.address,
            latitude: coords[0],
            longitude: coords[1],
            customer_name: values.name,
            customer_phone: values.phone
          })
        });
        
        const data = await response.json();

        if (data.mockRedirect) {
          setMockPaymentState({
            type: 'card',
            orderId: data.orderId,
            amount: cartTotal + 40,
            name: values.name,
            phone: values.phone,
            cardNum: values.cardNum,
            otp: data.otp
          });
          return;
        } else if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('Invalid checkout session response');
        }
      } catch (e) {
        alert('Payment initialization failed: ' + e.message);
        setStep(1);
      }
    }
  };

  const startTracking = (id) => {
    if (eventSource.current) eventSource.current.close();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    eventSource.current = new EventSource(`${API_URL}/api/orders/${id}/track`);
    eventSource.current.onmessage = e => {
      const data = JSON.parse(e.data);
      setStatus(data.status);
      setRiderCoords([data.lat, data.lng]);
      if (data.status === 'Delivered') {
        confetti({ particleCount: 150, spread: 80 });
        eventSource.current.close();
      }
    };
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const sessionId = query.get('session_id');
    const urlOrderId = query.get('order_id');

    if (sessionId && urlOrderId) {
      setStep(2);
      setGatewayMsg('Confirming payment with Stripe...');
      
      const confirmPayment = async () => {
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
          const response = await fetch(`${API_URL}/api/orders/confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, orderId: urlOrderId })
          });
          const result = await response.json();
          if (result.success) {
            setOrderId(urlOrderId);
            clearCart();
            confetti({ particleCount: 150, spread: 80 });
            setStep(3);
            startTracking(urlOrderId);
          } else {
            alert('Stripe payment confirmation failed');
            setStep(1);
          }
        } catch (e) {
          alert('Error confirming payment');
          setStep(1);
        }
      };

      confirmPayment();
    }

    return () => { if (eventSource.current) eventSource.current.close(); };
  }, []);

  const restaurantCoords = activeRestaurant 
    ? [parseFloat(activeRestaurant.latitude), parseFloat(activeRestaurant.longitude)]
    : [28.6139, 77.2090];

  return (
    <div className="container">
      <h2>{step === 1 ? 'Secure Checkout' : step === 2 ? 'Payment Gateway' : `Order Tracking #${orderId}`}</h2>
      
      {step === 1 && (
        cartItems.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem 0' }}>Your basket is empty.</p>
        ) : (
          <Formik
            initialValues={{ 
              name: user?.name || '', 
              phone: user?.phone || '', 
              address: 'Connaught Place, Delhi', 
              paymentMethod: 'COD', 
              cardNum: '', 
              expiry: '', 
              cvv: '', 
              upiId: '',
              saveAddress: false
            }}
            validationSchema={CheckoutSchema}
            onSubmit={handlePlaceOrder}
          >
            {({ values, setFieldValue, isSubmitting }) => (
              <Form className="checkout-layout">
                <div>
                  <div className="step-card">
                    <h3>1. Delivery Information</h3>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label className="form-label">Full Name</label>
                      <Field name="name">
                        {({ field, form }) => (
                          <input
                            {...field}
                            type="text"
                            className="form-input"
                            placeholder="Full Name (letters only)"
                            onChange={(e) => handleNameChange(e, form.setFieldValue)}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="name" component="div" className="form-error" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <Field name="phone">
                        {({ field, form }) => (
                          <input
                            {...field}
                            type="text"
                            className="form-input"
                            placeholder="10 Digit Mobile"
                            onChange={(e) => handlePhoneChange(e, form.setFieldValue)}
                          />
                        )}
                      </Field>
                      <ErrorMessage name="phone" component="div" className="form-error" />
                    </div>
                    {savedAddresses.length > 0 && (
                      <div className="form-group">
                        <label className="form-label">Select Saved Address</label>
                        <select
                          className="form-input"
                          style={{ marginBottom: '1rem', width: '100%' }}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'custom') {
                              setFieldValue('address', '');
                            } else {
                              const selected = savedAddresses.find(a => a.id.toString() === val);
                              if (selected) {
                                setFieldValue('address', selected.address_line);
                                if (selected.latitude && selected.longitude) {
                                  setCoords([parseFloat(selected.latitude), parseFloat(selected.longitude)]);
                                }
                              }
                            }
                          }}
                        >
                          <option value="custom">-- Use custom address --</option>
                          {savedAddresses.map(a => (
                            <option key={a.id} value={a.id}>{a.address_line}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Delivery Address</label>
                      <Field name="address" className="form-input" placeholder="Type custom address or select one from above" />
                      <ErrorMessage name="address" component="div" className="form-error" />
                    </div>
                    {user && (
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                        <Field type="checkbox" name="saveAddress" id="saveAddress" style={{ width: 'auto', cursor: 'pointer' }} />
                        <label htmlFor="saveAddress" style={{ fontSize: '0.85rem', cursor: 'pointer', userSelect: 'none' }}>Save this address to my profile</label>
                      </div>
                    )}
                    <p className="map-helper-text">Click the map to select drop off coordinates:</p>
                    <div style={{ height: '260px', borderRadius: '12px', overflow: 'hidden' }}>
                      <UniversalMap center={coords} onMapClick={setCoords} markerTitle="Delivery Pin" />
                    </div>
                  </div>

                  <div className="step-card" style={{ marginTop: '1.5rem' }}>
                    <h3>2. Choose Payment Option</h3>
                    <div className="review-tags" style={{ marginTop: '1rem', gap: '1rem', flexWrap: 'wrap' }}>
                      <button type="button" className={`filter-btn ${values.paymentMethod === 'COD' ? 'active' : ''}`} onClick={() => setFieldValue('paymentMethod', 'COD')}>Cash on Delivery (COD)</button>
                      <button type="button" className={`filter-btn ${values.paymentMethod === 'upi' ? 'active' : ''}`} onClick={() => setFieldValue('paymentMethod', 'upi')}>UPI Apps</button>
                      <button type="button" className={`filter-btn ${values.paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setFieldValue('paymentMethod', 'card')}>Credit/Debit Cards</button>
                      {profile && (
                        <button type="button" className={`filter-btn ${values.paymentMethod === 'wallet' ? 'active' : ''}`} onClick={() => setFieldValue('paymentMethod', 'wallet')}>
                          Wallet (Balance: ₹{parseFloat(profile.wallet_balance || 0).toFixed(2)})
                        </button>
                      )}
                    </div>

                    {values.paymentMethod === 'upi' && (
                      <div className="form-group" style={{ marginTop: '1.2rem' }}>
                        <label className="form-label">Enter UPI ID</label>
                        <Field name="upiId">
                          {({ field, form }) => (
                            <div style={{ position: 'relative' }}>
                              <input
                                {...field}
                                type="text"
                                className="form-input"
                                placeholder="e.g. username@okhdfcbank"
                                onChange={(e) => {
                                  form.setFieldValue('upiId', e.target.value);
                                  validateUPI(e.target.value);
                                }}
                                style={{ paddingRight: '2.5rem' }}
                              />
                              <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                                {upiAuthStatus === 'checking' && <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', margin: 0 }}></span>}
                                {upiAuthStatus === 'verified' && <span style={{ color: 'var(--veg-color)', fontSize: '1.1rem', fontWeight: 'bold' }}>✓ Verified</span>}
                                {upiAuthStatus === 'failed' && <span style={{ color: 'var(--nonveg-color)', fontSize: '1.1rem', fontWeight: 'bold' }}>✗ Invalid format</span>}
                              </div>
                            </div>
                          )}
                        </Field>
                        <ErrorMessage name="upiId" component="div" className="form-error" />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                          <button type="button" className="filter-btn" onClick={() => { setFieldValue('upiId', '9999999999@gpay'); validateUPI('9999999999@gpay'); }}>Google Pay</button>
                          <button type="button" className="filter-btn" onClick={() => { setFieldValue('upiId', '9999999999@ybl'); validateUPI('9999999999@ybl'); }}>PhonePe</button>
                          <button type="button" className="filter-btn" onClick={() => { setFieldValue('upiId', '9999999999@paytm'); validateUPI('9999999999@paytm'); }}>Paytm</button>
                        </div>
                      </div>
                    )}

                    {values.paymentMethod === 'card' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.2rem' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Card Number</span>
                            {cardBrand !== 'unknown' && (
                              <span style={{ 
                                textTransform: 'uppercase', 
                                fontSize: '0.7rem', 
                                padding: '0.1rem 0.4rem', 
                                borderRadius: '4px',
                                fontWeight: 700,
                                color: 'white',
                                backgroundColor: 
                                  cardBrand === 'visa' ? '#1a1f71' : 
                                  cardBrand === 'mastercard' ? '#eb001b' : 
                                  cardBrand === 'amex' ? '#007bc1' : 
                                  cardBrand === 'rupay' ? '#00549c' : '#777'
                              }}>
                                {cardBrand}
                              </span>
                            )}
                          </label>
                          <Field name="cardNum">
                            {({ field, form }) => (
                              <div style={{ position: 'relative' }}>
                                <input
                                  {...field}
                                  type="text"
                                  className="form-input"
                                  placeholder="XXXX XXXX XXXX XXXX"
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const clean = val.replace(/\D/g, '').substring(0, 16);
                                    const formatted = clean.match(/.{1,4}/g)?.join(' ') || '';
                                    form.setFieldValue('cardNum', formatted);
                                    validateCardNumber(clean);
                                  }}
                                  style={{ paddingRight: '2.5rem' }}
                                />
                                <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                                  {cardValid === true && <span style={{ color: 'var(--veg-color)', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>}
                                  {cardValid === false && <span style={{ color: 'var(--nonveg-color)', fontSize: '1.1rem', fontWeight: 'bold' }}>✗</span>}
                                </div>
                              </div>
                            )}
                          </Field>
                          <ErrorMessage name="cardNum" component="div" className="form-error" />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Expiry (MM/YY)</label>
                            <Field name="expiry">
                              {({ field, form }) => (
                                <div style={{ position: 'relative' }}>
                                  <input
                                    {...field}
                                    type="text"
                                    className="form-input"
                                    placeholder="MM/YY"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const clean = val.replace(/\D/g, '').substring(0, 4);
                                      let formatted = '';
                                      if (clean.length > 0) {
                                        if (clean.length <= 2) {
                                          formatted = clean;
                                        } else {
                                          formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}`;
                                        }
                                      }
                                      form.setFieldValue('expiry', formatted);
                                      validateExpiry(formatted);
                                    }}
                                    style={{ paddingRight: '2.5rem' }}
                                  />
                                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                                    {expiryValid === true && <span style={{ color: 'var(--veg-color)', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>}
                                    {expiryValid === false && <span style={{ color: 'var(--nonveg-color)', fontSize: '1.1rem', fontWeight: 'bold' }}>✗</span>}
                                  </div>
                                </div>
                              )}
                            </Field>
                            <ErrorMessage name="expiry" component="div" className="form-error" />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">CVV</label>
                            <Field name="cvv">
                              {({ field, form }) => (
                                <div style={{ position: 'relative' }}>
                                  <input
                                    {...field}
                                    type="password"
                                    className="form-input"
                                    placeholder="XXX"
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const clean = val.replace(/\D/g, '').substring(0, 3);
                                      form.setFieldValue('cvv', clean);
                                      validateCVV(clean);
                                    }}
                                    style={{ paddingRight: '2.5rem' }}
                                  />
                                  <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                                    {cvvValid === true && <span style={{ color: 'var(--veg-color)', fontSize: '1.1rem', fontWeight: 'bold' }}>✓</span>}
                                    {cvvValid === false && <span style={{ color: 'var(--nonveg-color)', fontSize: '1.1rem', fontWeight: 'bold' }}>✗</span>}
                                  </div>
                                </div>
                              )}
                            </Field>
                            <ErrorMessage name="cvv" component="div" className="form-error" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="sidebar-panel">
                    <h3>Checkout Basket</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>From: <strong>{activeRestaurant?.name}</strong></p>
                    <div className="cart-items-list" style={{ borderBottom: '1px solid var(--border-color)', margin: '1rem 0', paddingBottom: '0.5rem' }}>
                      {cartItems.map(item => (
                        <div key={item.id} className="cart-item-row" style={{ margin: '0.4rem 0' }}>
                          <div>{item.name} x {item.qty}</div>
                          <div>₹{item.price * item.qty}</div>
                        </div>
                      ))}
                    </div>
                    <div className="cart-summary">
                      <div className="summary-row"><span>Basket Total</span><span>₹{cartTotal}</span></div>
                      <div className="summary-row"><span>Delivery Fee</span><span>₹40</span></div>
                      <div className="summary-row total"><span>Grand Total</span><span>₹{cartTotal + 40}</span></div>
                      <button 
                        type="submit" 
                        disabled={
                          isSubmitting ||
                          (values.paymentMethod === 'card' && (!cardValid || !expiryValid || !cvvValid)) ||
                          (values.paymentMethod === 'upi' && upiAuthStatus !== 'verified') ||
                          (values.paymentMethod === 'wallet' && (!profile || (cartTotal + 40 > parseFloat(profile.wallet_balance))))
                        } 
                        className="checkout-btn" 
                        style={{ padding: '0.9rem', fontSize: '1rem' }}
                      >
                        {values.paymentMethod === 'wallet' && profile && (cartTotal + 40 > parseFloat(profile.wallet_balance))
                          ? 'Insufficient Wallet Balance'
                          : values.paymentMethod === 'COD' 
                            ? 'Place COD Order' 
                            : 'Pay & Place Order'
                        }
                      </button>
                    </div>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        )
      )}

      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '2rem' }}>
          <div className="spinner" style={{ width: '70px', height: '70px', borderWidth: '6px' }}></div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Processing Payment</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{gatewayMsg}</p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="checkout-layout">
          <div style={{ height: '420px', borderRadius: '12px', overflow: 'hidden' }}>
            <UniversalMap center={coords} restPos={restaurantCoords} riderPos={riderCoords} markerTitle="Delivery Drop Location" />
          </div>
          <div>
            <div className="tracking-card">
              <div className="tracking-status-banner"><Truck size={20} className="animate-shake" /> {status}</div>
              <div className="tracking-timeline">
                <div className={`timeline-step ${status ? 'active' : ''}`}>Preparing</div>
                <div className={`timeline-step ${['Out for Delivery', 'Delivered'].includes(status) ? 'active' : ''}`}>Delivery</div>
                <div className={`timeline-step ${status === 'Delivered' ? 'active' : ''}`}>Arrived</div>
              </div>
              {status === 'Delivered' && (
                <div style={{ marginTop: '2rem' }}>
                  <CheckCircle2 size={38} style={{ color: 'var(--veg-color)', margin: '0 auto 0.6rem' }} />
                  <h4>Food Delivered successfully!</h4>
                  <button className="success-btn" style={{ marginTop: '1rem' }} onClick={() => setStep(1)}>Order Again</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Render Mock Payment Overlays if active */}
      {mockPaymentState && mockPaymentState.type === 'upi' && (
        <MockUPIOverlay
          state={mockPaymentState}
          onVerify={handleVerifyMockUPI}
          onCancel={() => {
            setMockPaymentState(null);
            setStep(1);
          }}
        />
      )}

      {mockPaymentState && mockPaymentState.type === 'card' && (
        <MockCardOverlay
          state={mockPaymentState}
          onVerify={handleVerifyMockCard}
          onCancel={() => {
            setMockPaymentState(null);
            setStep(1);
          }}
        />
      )}
    </div>
  );
}

function MockUPIOverlay({ state, onVerify, onCancel }) {
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.length < 4) {
      alert('Please enter a valid 4 to 6-digit UPI PIN');
      return;
    }
    setSubmitting(true);
    onVerify(pin);
  };

  return (
    <div className="mock-payment-overlay">
      <div className="mock-razorpay-card">
        <div className="mock-razorpay-header">
          <div className="mock-razorpay-header-left">
            <span className="mock-razorpay-logo">Razorpay</span>
            <span className="mock-razorpay-badge">Sandbox Mode</span>
          </div>
          <div className="mock-razorpay-header-right">
            <div className="mock-razorpay-amount">₹{state.amount}</div>
            <div className="mock-razorpay-desc">Order #{state.orderId}</div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mock-razorpay-body">
          <div className="mock-razorpay-info-row">
            <div className="mock-razorpay-info-item">
              <span className="mock-razorpay-label">Customer Name</span>
              <span className="mock-razorpay-val">{state.name}</span>
            </div>
            <div className="mock-razorpay-info-item">
              <span className="mock-razorpay-label">Mobile Number</span>
              <span className="mock-razorpay-val">{state.phone}</span>
            </div>
            <div className="mock-razorpay-info-item">
              <span className="mock-razorpay-label">UPI ID</span>
              <span className="mock-razorpay-val">{state.upiId || 'No UPI ID provided'}</span>
            </div>
          </div>
          
          <div className="mock-razorpay-input-container">
            <label className="mock-razorpay-input-label">Enter 4-6 Digit UPI PIN</label>
            <input
              type="password"
              className="mock-razorpay-input"
              value={pin}
              maxLength={6}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              autoFocus
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '0.2rem' }}>
              For simulation, enter any PIN (e.g., 1234)
            </span>
          </div>
          
          <button type="submit" disabled={submitting} className="mock-razorpay-btn">
            {submitting ? 'Verifying PIN...' : `Pay ₹${state.amount}`}
          </button>
        </form>
        <div className="mock-razorpay-footer">
          <span>Securely processed by Razorpay Mock</span>
          <button type="button" className="mock-razorpay-cancel" onClick={onCancel}>Cancel Payment</button>
        </div>
      </div>
    </div>
  );
}

function MockCardOverlay({ state, onVerify, onCancel }) {
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      alert('Please enter a 6-digit OTP');
      return;
    }
    setSubmitting(true);
    const success = await onVerify(otp);
    if (!success) {
      setSubmitting(false);
    }
  };

  const cardDigits = state.cardNum.replace(/\s/g, '');
  const last4Card = cardDigits.substring(cardDigits.length - 4);
  const last4Phone = state.phone.substring(state.phone.length - 4);

  return (
    <div className="mock-payment-overlay">
      <div className="mock-bank-card">
        <div className="mock-bank-header">
          <div className="mock-bank-logo-sec">
            <span className="mock-bank-title">Secure Bank Gateway</span>
          </div>
          <span className="mock-bank-secure-badge">Verified by Visa / ID Check</span>
        </div>
        <form onSubmit={handleSubmit} className="mock-bank-body">
          <table className="mock-bank-details">
            <tbody>
              <tr>
                <td className="label">Merchant</td>
                <td className="value">Zomato Clone</td>
              </tr>
              <tr>
                <td className="label">Amount</td>
                <td className="value">₹{state.amount}</td>
              </tr>
              <tr>
                <td className="label">Card Number</td>
                <td className="value">•••• •••• •••• {last4Card || '0000'}</td>
              </tr>
            </tbody>
          </table>

          <div className="mock-bank-instructions">
            A one-time passcode (OTP) has been sent to your registered mobile number ending in **{last4Phone || 'XXXX'}.
            {state.otp && (
              <div style={{ marginTop: '0.6rem', padding: '0.4rem', background: '#ffebee', border: '1px dashed #ef4444', borderRadius: '4px', fontWeight: '700', color: '#ef4444', textAlign: 'center', fontSize: '0.9rem' }}>
                [SANDBOX OTP] Code: {state.otp}
              </div>
            )}
          </div>

          <div className="mock-bank-input-sec">
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.4rem' }}>Enter 6-Digit OTP</label>
            <input
              type="text"
              className="mock-bank-input"
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              required
            />
          </div>

          <div className="mock-bank-actions">
            <button type="button" className="mock-bank-cancel-btn" onClick={onCancel}>Cancel</button>
            <button type="submit" disabled={submitting} className="mock-bank-submit-btn">
              {submitting ? 'Authenticating...' : 'Submit OTP'}
            </button>
          </div>
          
          <div className="mock-bank-resend-text">
            Didn't receive the OTP? <button type="button" className="mock-bank-resend-link" onClick={() => alert('OTP has been resent!')}>Resend OTP</button>
          </div>
        </form>
      </div>
    </div>
  );
}
