import { render, screen, fireEvent } from '@testing-library/react';

import TagInput from './TagInput.jsx';

describe('TagInput', () => {
  test('adds a tag when Enter is pressed', () => {
    const handleChange = jest.fn();
    render(<TagInput tags={[]} onChange={handleChange} />);

    const input = screen.getByPlaceholderText(/add tags/i);
    fireEvent.change(input, { target: { value: 'work' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith(['work']);
  });

  test('removes a tag when its remove button is clicked', () => {
    const handleChange = jest.fn();
    render(<TagInput tags={['work', 'urgent']} onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText('Remove tag work'));

    expect(handleChange).toHaveBeenCalledWith(['urgent']);
  });

  test('does not add a duplicate tag', () => {
    const handleChange = jest.fn();
    render(<TagInput tags={['work']} onChange={handleChange} />);

    const input = screen.getByDisplayValue('');
    fireEvent.change(input, { target: { value: 'work' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(handleChange).not.toHaveBeenCalled();
  });
});
