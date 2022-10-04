import React from "react";

const Legend = ({ title, legendItems }) => {
  return (
    <div className="explanatory-notes">
      <h3>{title}</h3>
      <React.Fragment>
        {legendItems.map((item, index) => {
          return (
            <div key={index} className="note">
              <span
                className="color"
                style={{ backgroundColor: `${item.color}` }}
              ></span>
              {item.name}
            </div>
          );
        })}
      </React.Fragment>
    </div>
  );
};

export default Legend;
