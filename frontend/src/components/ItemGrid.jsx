import React from 'react';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import ItemCard from './ItemCard';
import PropTypes from 'prop-types';

function ItemGrid({ items, onAddToCart }) {
  return (
    <Container className="py-4">
      <Row xs={1} sm={2} md={3} className="g-4">
        {items.map(item => (
          <Col key={item.id}>
            <ItemCard 
              item={item} 
              onAddToCart={onAddToCart}
            />
          </Col>
        ))}
      </Row>
    </Container>
  );
}

ItemGrid.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      image: PropTypes.string.isRequired,
      rating: PropTypes.number.isRequired
    })
  ).isRequired,
  onAddToCart: PropTypes.func.isRequired
};

export default ItemGrid;