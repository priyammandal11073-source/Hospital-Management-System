import React from "react";

const Card = ({ title, children, className, ...props }) => {
  return (
    <div
      className={`
        bg-white rounded-md p-6 shadow-sm
        ${className}
      `}
      {...props}
    >
      {title && <h3 className="mb-4 text-sm font-medium text-neutral-600">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
export { Card };