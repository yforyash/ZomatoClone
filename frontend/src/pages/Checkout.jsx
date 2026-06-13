import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import confetti from 'canvas-confetti';
import { Truck, CheckCircle2 } from 'lucide-react';
import { UniversalMap } from '../components/UniversalMap';

const CheckoutSchema = Yup.object().shape({
  name: Yup.string().required('Full Name is required'),
  phone: Yup.string().matches(/^[0-9]{10}$/, 'Must be a 10 digit number').required('Phone is required'),
  address: Yup.string().required('Delivery address is required'),
  paymentMethod: Yup.string().required('Select a payment method'),
  cardNum: Yup.string().when('paymentMethod', { is: 'card', then: () => Yup.string().matches(/^[0-9]{16}$/, 'Must be 16 digits').required('Required') }),
  cvv: Yup.string().when('paymentMethod', { is: 'card', then: () => Yup.string().matches(/^[0-9]{3}$/, 'Must be 3 digits').required('Required') }),
  upiId: Yup.string().when('paymentMethod', { is: 'upi', then: () => Yup.string().required('UPI ID is required') })
});

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

  const handlePlaceOrder = async (values) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

    if (values.paymentMethod === 'COD') {
      try {
        const response = await fetch(`${API_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
    } else {
      try {
        setStep(2);
        setGatewayMsg('Initializing secure checkout...');

        const response = await fetch(`${API_URL}/api/orders/create-checkout-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
          setGatewayMsg('Contacting secure bank servers (Mock)...');
          await new Promise(r => setTimeout(r, 1200));
          setGatewayMsg('Authorizing payment transaction (Mock)...');
          await new Promise(r => setTimeout(r, 1200));
          
          const confirmRes = await fetch(`${API_URL}/api/orders/confirm-payment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: 'mock', orderId: data.orderId })
          });
          const confirmData = await confirmRes.json();

          if (confirmData.success) {
            setOrderId(data.orderId);
            setStep(3);
            clearCart();
            startTracking(data.orderId);
            confetti({ particleCount: 80, spread: 60 });
          } else {
            alert('Mock payment confirmation failed');
            setStep(1);
          }
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
            initialValues={{ name: '', phone: '', address: 'Connaught Place, Delhi', paymentMethod: 'COD', cardNum: '', cvv: '', upiId: '' }}
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
                      <Field name="name" className="form-input" />
                      <ErrorMessage name="name" component="div" className="form-error" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <Field name="phone" className="form-input" placeholder="10 Digit Mobile" />
                      <ErrorMessage name="phone" component="div" className="form-error" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Delivery Address</label>
                      <Field name="address" className="form-input" />
                      <ErrorMessage name="address" component="div" className="form-error" />
                    </div>
                    <p className="map-helper-text">Click the map to select drop off coordinates:</p>
                    <div style={{ height: '260px', borderRadius: '12px', overflow: 'hidden' }}>
                      <UniversalMap center={coords} onMapClick={setCoords} markerTitle="Delivery Pin" />
                    </div>
                  </div>

                  <div className="step-card" style={{ marginTop: '1.5rem' }}>
                    <h3>2. Choose Payment Option</h3>
                    <div className="review-tags" style={{ marginTop: '1rem', gap: '1rem' }}>
                      <button type="button" className={`filter-btn ${values.paymentMethod === 'COD' ? 'active' : ''}`} onClick={() => setFieldValue('paymentMethod', 'COD')}>Cash on Delivery (COD)</button>
                      <button type="button" className={`filter-btn ${values.paymentMethod === 'upi' ? 'active' : ''}`} onClick={() => setFieldValue('paymentMethod', 'upi')}>UPI Apps</button>
                      <button type="button" className={`filter-btn ${values.paymentMethod === 'card' ? 'active' : ''}`} onClick={() => setFieldValue('paymentMethod', 'card')}>Credit/Debit Cards</button>
                    </div>

                    {values.paymentMethod === 'upi' && (
                      <div className="form-group" style={{ marginTop: '1.2rem' }}>
                        <label className="form-label">Enter UPI ID</label>
                        <Field name="upiId" className="form-input" placeholder="e.g. username@okhdfcbank" />
                        <ErrorMessage name="upiId" component="div" className="form-error" />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                          <button type="button" className="filter-btn" onClick={() => setFieldValue('upiId', '9999999999@gpay')}>Google Pay</button>
                          <button type="button" className="filter-btn" onClick={() => setFieldValue('upiId', '9999999999@ybl')}>PhonePe</button>
                          <button type="button" className="filter-btn" onClick={() => setFieldValue('upiId', '9999999999@paytm')}>Paytm</button>
                        </div>
                      </div>
                    )}

                    {values.paymentMethod === 'card' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.2rem' }}>
                        <div className="form-group">
                          <label className="form-label">Card Number</label>
                          <Field name="cardNum" className="form-input" placeholder="16 Digit Card Number" />
                          <ErrorMessage name="cardNum" component="div" className="form-error" />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">Expiry (MM/YY)</label>
                            <Field name="expiry" className="form-input" placeholder="12/28" />
                          </div>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label">CVV</label>
                            <Field name="cvv" type="password" className="form-input" placeholder="123" />
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
                      <button type="submit" disabled={isSubmitting} className="checkout-btn" style={{ padding: '0.9rem', fontSize: '1rem' }}>
                        {values.paymentMethod === 'COD' ? 'Place COD Order' : 'Pay & Place Order'}
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
    </div>
  );
}
