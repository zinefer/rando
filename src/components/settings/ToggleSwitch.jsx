import React from 'react';

/**
 * Toggle Switch component for boolean settings
 * 
 * @param {Object} props
 * @param {String} props.id - Unique identifier for the toggle
 * @param {Boolean} props.checked - Whether the toggle is checked
 * @param {Function} props.onChange - Callback for when the toggle is changed
 * @param {String} props.label - Label for the toggle
 */
const ToggleSwitch = ({ id, checked, onChange, label }) => (
  <div className="flex items-center justify-between py-2">
    <label htmlFor={id} className="text-sm text-gray-300 flex-grow">
      {label}
    </label>
    <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 border-gray-700 appearance-none cursor-pointer peer"
      />
      <label
        htmlFor={id}
        className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-700 cursor-pointer peer-checked:bg-indigo-600"
      ></label>
    </div>
  </div>
);

export default ToggleSwitch;
