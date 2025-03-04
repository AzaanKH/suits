import React from 'react';
import { Container, Card, Button, Row, Col, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

function Cart({ cartItems = [], onUpdateQuantity, onRemoveItem }) {
  const navigate = useNavigate();
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <Container className="py-4">
      <h2 className="mb-4">Shopping Cart</h2>
      {cartItems.length === 0 ? (
        <Card>
          <Card.Body className="text-center">
            Your cart is empty
          </Card.Body>
        </Card>
      ) : (
        <>
          {cartItems.map((item) => (
            <Card key={item.id} className="mb-3">
              <Card.Body>
                <Row className="align-items-center">
                  <Col xs={12} md={3}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="img-fluid rounded"
                      style={{ maxHeight: '100px' }}
                    />
                  </Col>
                  <Col xs={12} md={4}>
                    <h5>{item.name}</h5>
                    <p className="text-muted">{item.description}</p>
                    <p>Size: {item.size}</p>
                  </Col>
                  <Col xs={12} md={2}>
                    <Form.Control
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value))}
                      className="mb-2"
                    />
                  </Col>
                  <Col xs={6} md={2}>
                    <h5>${(item.price * item.quantity).toFixed(2)}</h5>
                  </Col>
                  <Col xs={6} md={1} className="text-end">
                    <Button 
                      variant="danger"
                      onClick={() => onRemoveItem(item.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
          
          <Card className="mt-4">
            <Card.Body>
              <Row className="align-items-center">
                <Col>
                  <h4 className="mb-0">Total: ${calculateTotal().toFixed(2)}</h4>
                </Col>
                <Col className="text-end">
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={() => navigate('/checkout')}
                  >
                    Proceed to Checkout
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </>
      )}
    </Container>
  );
}

export default Cart;