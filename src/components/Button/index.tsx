import styled from 'styled-components'

const Button = styled.button`
  background-color: #007bff;
  border-color: #007bff;
  border-radius: 4px;
  border: 0;
  color: #fff;
  cursor: pointer;
  display: block;
  font-size: 14px;
  margin-bottom: 4px;
  padding: 8px;
  text-transform: uppercase;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  width: 100%;
  &:hover {
    color: #fff;
    background-color: #0069d9;
    border-color: #0062cc;
  }
  &:focus {
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.5);
  }
  &:active {
    background-color: #0062cc;
    border-color: #005cbf;
  }
`

export default Button
