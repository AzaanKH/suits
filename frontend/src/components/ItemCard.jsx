import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar as faStarSolid, faStarHalfAlt } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarEmpty } from '@fortawesome/free-regular-svg-icons';

function ItemCard({ item, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState('Size');

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
  };

  const handleAddToCartClick = () => {
    onAddToCart(item, selectedSize);
  };

  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2;

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        // Full star
        stars.push(
          <FontAwesomeIcon 
            key={i}
            icon={faStarSolid}
            color="#ffc107"
          />
        );
      } else if (i - 0.5 <= roundedRating) {
        // Half star
        stars.push(
          <FontAwesomeIcon 
            key={i}
            icon={faStarHalfAlt}
            color="#ffc107"
          />
        );
      } else {
        // Empty star
        stars.push(
          <FontAwesomeIcon 
            key={i}
            icon={faStarEmpty}
            color="#e4e5e9"
          />
        );
      }
    }
    return stars;
  };

  return (
    <Card className="h-100">
      {item.image && (
        <Card.Img 
          variant="top" 
          src={item.image} 
          alt={item.name}
          className="img-fluid"
        />
      )}
      <Card.Body className="d-flex flex-column">
        <Card.Title className="h5">{item.name}</Card.Title>
        <Card.Text>{item.description}</Card.Text>
        <Card.Text className="h3 text-primary mb-3">${item.price}</Card.Text>
        <Card.Text>{renderStars(item.rating)} ({item.rating})</Card.Text>
        
        <div className="mt-auto">
          <Row className="g-2">
            <Col xs={6}>
              <Button 
                variant="primary" 
                onClick={handleAddToCartClick}
                className="w-100"
              >
                Add to cart
              </Button>
            </Col>
            <Col xs={6}>
              <DropdownButton 
                id="size-button" 
                title={selectedSize} 
                className="w-100"
              >
                <Dropdown.Item onClick={() => handleSizeSelect('Small')}>Small</Dropdown.Item>
                <Dropdown.Item onClick={() => handleSizeSelect('Medium')}>Medium</Dropdown.Item>
                <Dropdown.Item onClick={() => handleSizeSelect('Large')}>Large</Dropdown.Item>
                <Dropdown.Item onClick={() => handleSizeSelect('X-Large')}>X-Large</Dropdown.Item>
              </DropdownButton>
            </Col>
          </Row>
        </div>
      </Card.Body>
    </Card>
  );
}

export default ItemCard;