import React from 'react';
import { Form, Row, Col } from 'react-bootstrap';

interface RecipientFormProps {
  gender: string;
  age: number | '';
  relationship: string;
  freeform: string;
  onGenderChange: (v: string) => void;
  onAgeChange: (v: number | '') => void;
  onRelationshipChange: (v: string) => void;
  onFreeformChange: (v: string) => void;
}

const GENDER_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Non-Binary', value: 'NON_BINARY' },
];

const RELATIONSHIP_OPTIONS = [
  { label: 'Friend', value: 'FRIEND' },
  { label: 'Sibling', value: 'SIBLING' },
  { label: 'Parent', value: 'PARENT' },
  { label: 'Child', value: 'CHILD' },
  { label: 'Romantic Partner', value: 'ROMANTIC_PARTNER' },
  { label: 'Grand Parent', value: 'GRAND_PARENT' },
  { label: 'Colleague', value: 'COLLEAGUE' },
];

const RecipientForm: React.FC<RecipientFormProps> = ({
  gender,
  age,
  relationship,
  freeform,
  onGenderChange,
  onAgeChange,
  onRelationshipChange,
  onFreeformChange,
}) => {
  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onAgeChange('');
      return;
    }
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 100) {
      onAgeChange(parsed);
    }
  };

  return (
    <Form>
      <Row className="mb-3">
        <Col md={4}>
          <Form.Group>
            <Form.Label>Gender</Form.Label>
            <Form.Select
              value={gender}
              onChange={(e) => onGenderChange(e.target.value)}
            >
              <option value="">Select gender...</option>
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Age</Form.Label>
            <Form.Control
              type="number"
              min={1}
              max={100}
              value={age}
              onChange={handleAgeChange}
              placeholder="Enter age"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Relationship</Form.Label>
            <Form.Select
              value={relationship}
              onChange={(e) => onRelationshipChange(e.target.value)}
            >
              <option value="">Select relationship...</option>
              {RELATIONSHIP_OPTIONS.map((rel) => (
                <option key={rel.value} value={rel.value}>
                  {rel.label}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row className="mb-3">
        <Col>
          <Form.Group>
            <Form.Label>Giving Details</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={freeform}
              onChange={(e) => onFreeformChange(e.target.value)}
              placeholder="Any additional details about the gift recipient or occasion..."
            />
          </Form.Group>
        </Col>
      </Row>
    </Form>
  );
};

export default RecipientForm;
